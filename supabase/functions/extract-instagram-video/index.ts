import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const apifyApiKey = Deno.env.get('APIFY_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instagramUrl } = await req.json();

    if (!instagramUrl || typeof instagramUrl !== 'string') {
      throw new Error('Valid Instagram URL is required');
    }

    // Validate Instagram URL format
    if (!instagramUrl.includes('instagram.com') || (!instagramUrl.includes('/reel/') && !instagramUrl.includes('/p/'))) {
      throw new Error('Invalid Instagram URL format. Must be a reel or post URL.');
    }

    if (!apifyApiKey) {
      throw new Error('Apify API key not configured');
    }

    console.log('Extracting video URL for:', instagramUrl);

    try {
      // Call Apify Instagram Video Downloader with timeout
      const apifyResponse = await Promise.race([
        fetch(`https://api.apify.com/v2/acts/epctex~instagram-video-downloader/run-sync-get-dataset-items?token=${apifyApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startUrls: [instagramUrl],
            quality: "highest",
            proxy: {
              useApifyProxy: true
            }
          }),
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        )
      ]) as Response;

      if (!apifyResponse.ok) {
        const errorText = await apifyResponse.text();
        console.error('Apify API error:', errorText);
        throw new Error(`Apify API error: ${apifyResponse.status} - ${errorText}`);
      }

      const apifyData = await apifyResponse.json();
      console.log('Apify response:', apifyData);

      if (!apifyData || apifyData.length === 0) {
        console.error('No video data returned from Apify for URL:', instagramUrl);
        throw new Error('No video data found. The Instagram post may be private, deleted, or not accessible.');
      }

      const videoData = apifyData[0];
      
      // Validate that we have essential video data
      if (!videoData) {
        console.error('Empty video data structure:', videoData);
        throw new Error('Invalid video data received from Instagram');
      }

      // Check for downloadUrl from epctex actor
      const videoUrl = videoData.downloadUrl;
      if (!videoUrl) {
        console.error('No downloadUrl found in data:', videoData);
        throw new Error('No video download URL found in the response');
      }

      return new Response(JSON.stringify({
        success: true,
        videoUrl: videoUrl,
        caption: videoData.caption || '',
        metadata: {
          sourceUrl: videoData.sourceUrl || instagramUrl,
          videoPosition: videoData.videoPosition || 1
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (apifyError) {
      console.error('Apify extraction failed:', apifyError);
      
      // Return a more user-friendly error
      const errorMessage = apifyError.message.includes('timeout') 
        ? 'Instagram request timed out. Please try again later.'
        : apifyError.message.includes('private')
        ? 'This Instagram post is private or not accessible.'
        : 'Failed to extract video from Instagram. The post may be private, deleted, or temporarily unavailable.';
      
      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error('Instagram video extraction error:', error);
    
    // Return appropriate HTTP status based on error type
    const status = error.message.includes('Invalid Instagram URL') || 
                   error.message.includes('image post') ||
                   error.message.includes('required') ? 400 : 500;
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});