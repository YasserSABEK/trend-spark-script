import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let user: any = null;
  let cleanUsername = '';
  let shouldRefundCredits = false;
  let supabase: any = null;

  try {
    const { username } = await req.json();
    if (!username) {
      throw new Error('Username is required');
    }

    cleanUsername = username.replace(/^@/, '');

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apifyToken = Deno.env.get('APIFY_API_KEY');
    
    // Enhanced API key validation and logging
    const allEnvKeys = Object.keys(Deno.env.toObject()).filter(key => 
      key.includes('APIFY') || key.includes('API')
    );
    
    console.log('🔍 Environment check for scrape-tiktok-user:');
    console.log('- APIFY_API_KEY exists:', !!apifyToken);
    console.log('- APIFY_API_KEY length:', apifyToken ? apifyToken.length : 0);
    console.log('- APIFY_API_KEY prefix:', apifyToken ? apifyToken.substring(0, 15) + '...' : 'NOT_FOUND');
    console.log('- All API-related env keys:', allEnvKeys);
    
    if (!apifyToken) {
      console.error('❌ APIFY_API_KEY not found in environment variables');
      console.error('Available environment keys:', Object.keys(Deno.env.toObject()));
      throw new Error('TikTok scraping service temporarily unavailable. API key not configured.');
    }
    
    console.log('✅ APIFY_API_KEY found, proceeding with TikTok user scraping...');

    supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !authUser) throw new Error('Authentication failed');
    user = authUser;

    // Deduct credits using new credit system
    const { data: creditResult, error: creditError } = await supabase.rpc('spend_credits', {
      user_id_param: user.id,
      amount_param: 1,
      reason_param: 'TikTok user scraping',
      ref_type_param: 'tiktok_user_scrape',
      ref_id_param: cleanUsername,
    });
    if (creditError) throw new Error('Failed to process credits: ' + creditError.message);
    if (!creditResult.ok) throw new Error(creditResult.error || 'Insufficient credits');

    console.log(`Starting TikTok user scrape for: ${cleanUsername}`);

    // Track operation for potential refund
    shouldRefundCredits = true;

    // Configure Apify run with new apidojo/tiktok-scraper
    const actorId = 'HeKlzx1SPmubcOfmA';
    const input = {
      customMapFunction: "(object) => { return {...object} }",
      includeSearchKeywords: false,
      maxItems: 100,
      sortType: "RELEVANCE",
      startUrls: [`https://www.tiktok.com/@${cleanUsername}`]
    } as Record<string, unknown>;

    // Start Apify run
    const startResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`Failed to start Apify run: ${startResponse.statusText} - ${errorText}`);
    }

    const startData = await startResponse.json();
    const runId = startData.data.id;
    console.log(`Started Apify run: ${runId}`);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60;
    let runData: any;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { Authorization: `Bearer ${apifyToken}` },
      });
      runData = await statusResponse.json();
      const status = runData.data.status;
      console.log(`Run status (attempt ${attempts + 1}): ${status}`);
      if (status === 'SUCCEEDED') break;
      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        throw new Error(`Apify run failed with status: ${status}`);
      }
      attempts++;
    }

    if (attempts >= maxAttempts) throw new Error('Apify run timed out');

    // Fetch dataset items
    const datasetId = runData.data.defaultDatasetId;
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
      headers: { Authorization: `Bearer ${apifyToken}` },
    });
    const items = await datasetResponse.json();
    console.log(`Retrieved ${items.length} items for user: ${cleanUsername}`);

    // Filter to recent videos (last 1 year) and map with new data structure
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const processedVideos = (items || [])
      .filter((video: any) => {
        const uploadedAt = video.uploadedAt || video.uploadedAtFormatted || null;
        if (!uploadedAt) return false;
        // Handle both timestamp (seconds) and ISO string formats
        const timestamp = typeof uploadedAt === 'number' ? uploadedAt * 1000 : uploadedAt;
        const d = new Date(timestamp);
        return d >= oneYearAgo;
      })
      .map((video: any) => {
        const hashtags = extractHashtags(video.title || '');
        return {
          post_id: video.id || `tiktok_${Date.now()}_${Math.random()}`,
          url: video.postPage || video.url,
          web_video_url: video.postPage || video.url,
          caption: video.title || '',
          hashtags,
          username: video['channel.username'] || cleanUsername,
          display_name: video['channel.name'] || null,
          author_avatar: video['channel.avatar'] || null,

          digg_count: video.likes || 0,
          share_count: video.shares || 0,
          play_count: video.views || 0,
          comment_count: video.comments || 0,
          collect_count: video.bookmarks || 0,

          video_duration: video['video.duration'] || null,
          is_video: true,
          thumbnail_url: video['video.thumbnail'] || video['video.cover'] || null,
          video_url: video['video.url'] || null,

          music_name: video['song.title'] || null,
          music_author: video['song.artist'] || null,
          music_original: video['song.artist'] === video['channel.name'],

          viral_score: calculateViralScore(
            video.likes || 0,
            video.comments || 0,
            video.views || 0,
            video.shares || 0,
          ),
          engagement_rate: calculateEngagementRate(
            video.likes || 0,
            video.comments || 0,
            video.shares || 0,
            video.bookmarks || 0,
            video.views || 0,
          ),

          timestamp: video.uploadedAtFormatted || (video.uploadedAt ? new Date(video.uploadedAt * 1000).toISOString() : null),
          platform: 'tiktok',
          user_id: user.id,
          search_username: cleanUsername,
          apify_run_id: runId,
          dataset_id: datasetId,
        };
      });

    // Return processed videos directly instead of saving to database
    console.log(`Processed ${processedVideos.length} videos for immediate display`);
    // Note: Videos are not saved to database anymore, they're returned for frontend display

    // Mark operation as successful - don't refund credits
    shouldRefundCredits = false;

    return new Response(
      JSON.stringify({ success: true, data: processedVideos, username: cleanUsername, videosFound: processedVideos.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('scrape-tiktok-user error:', error);
    
    // Refund credits if operation failed and we successfully deducted them
    if (shouldRefundCredits && user?.id && supabase) {
      try {
        await supabase.rpc('spend_credits', {
          user_id_param: user.id,
          amount_param: -1, // Negative amount for refund
          reason_param: 'TikTok scraping refund - operation failed',
          ref_type_param: 'tiktok_user_scrape_refund',
          ref_id_param: cleanUsername || 'unknown',
        });
        console.log('Refunded 1 credit due to operation failure');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#\w+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map((t) => t.substring(1).toLowerCase()) : [];
}

function calculateViralScore(likes: number, comments: number, views: number, shares: number): number {
  const engagement = likes + comments * 3 + shares * 5;
  const viewRatio = views > 0 ? engagement / views : 0;
  return Math.round(Math.min(100, engagement * 0.6 + viewRatio * 10000 * 0.4));
}

function calculateEngagementRate(likes: number, comments: number, shares: number, collects: number, views: number): number {
  if (views === 0) return 0;
  const total = likes + comments + shares + collects;
  return total / views;
}
