import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OEmbedResponse {
  html: string
  thumbnail_url: string
  width: number
  height: number
  author_name?: string
  title?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let tiktokUrl: string | null = null;
    
    // Handle both GET (URL params) and POST (body) requests
    if (req.method === 'GET') {
      const url = new URL(req.url)
      tiktokUrl = url.searchParams.get('url')
    } else if (req.method === 'POST') {
      const body = await req.json()
      tiktokUrl = body.url
    }

    if (!tiktokUrl) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing url parameter' 
        }),
        { 
          status: 200, // Changed from 400 to 200
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract video ID from TikTok URL
    const videoIdMatch = tiktokUrl.match(/\/video\/(\d+)/)
    if (!videoIdMatch) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid TikTok URL format',
          fallback_url: tiktokUrl 
        }),
        { 
          status: 200, // Changed from 400 to 200
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const videoId = videoIdMatch[1]

    // Initialize Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header for tracking cache ownership
    const authHeader = req.headers.get('authorization')
    let userId: string | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id || null
      } catch (error) {
        console.log('Could not extract user from token (non-authenticated request)')
      }
    }

    // Check cache first - refresh if older than 24 hours
    const { data: cached } = await supabase
      .from('tiktok_oembed_cache')
      .select('*')
      .eq('video_id', videoId)
      .gte('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle()

    if (cached) {
      console.log(`Cache hit for video ${videoId}`)
      return new Response(
        JSON.stringify({
          html: cached.html,
          thumbnail_url: cached.thumbnail_url,
          width: cached.width,
          height: cached.height,
          cached: true
        }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400'
          }
        }
      )
    }

    console.log(`Fetching oEmbed for video ${videoId}`)

    // Fetch from TikTok oEmbed API with proper User-Agent
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktokUrl)}`
    const oembedResponse = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!oembedResponse.ok) {
      console.error(`oEmbed API error: ${oembedResponse.status}`)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to fetch oEmbed data',
          fallback_url: tiktokUrl,
          status: oembedResponse.status 
        }),
        { 
          status: 200, // Changed from 500 to 200
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const oembedData: OEmbedResponse = await oembedResponse.json()

    // Parse width and height, handling string values like "100%"
    const parseSize = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Handle percentage values by returning sensible defaults
        if (value.includes('%')) return 325; // Standard TikTok width
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 325 : parsed;
      }
      return 325; // Default width for TikTok videos
    }

    const width = parseSize(oembedData.width);
    const height = parseSize(oembedData.height);

    // UPSERT to cache with user tracking
    const { error: upsertError } = await supabase
      .from('tiktok_oembed_cache')
      .upsert({
        video_id: videoId,
        url: tiktokUrl,
        html: oembedData.html,
        thumbnail_url: oembedData.thumbnail_url,
        width: width,
        height: height,
        requested_by_user_id: userId,
        fetched_at: new Date().toISOString()
      }, {
        onConflict: 'video_id'
      })

    if (upsertError) {
      console.error('Cache upsert error:', upsertError)
    }

    return new Response(
      JSON.stringify({
        html: oembedData.html,
        thumbnail_url: oembedData.thumbnail_url,
        width: oembedData.width,
        height: oembedData.height,
        cached: false
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400'
        }
      }
    )

  } catch (error) {
    console.error('TikTok oEmbed function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message,
        fallback_url: new URL(req.url).searchParams.get('url') 
      }),
      { 
        status: 200, // Changed from 500 to 200
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})