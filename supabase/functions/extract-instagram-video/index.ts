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

    if (!apifyApiKey) {
      throw new Error('Apify API key not configured');
    }

    console.log('Extracting video URL for:', instagramUrl);

    // Call Apify Instagram Reel Downloader
    const apifyResponse = await fetch(`https://api.apify.com/v2/acts/presetshubham~instagram-reel-downloader/run-sync-get-dataset-items?token=${apifyApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proxyConfiguration: {
          useApifyProxy: true
        },
        reelLinks: [instagramUrl],
        verboseLog: false
      }),
    });

    if (!apifyResponse.ok) {
      throw new Error(`Apify error: ${await apifyResponse.text()}`);
    }

    const apifyData = await apifyResponse.json();

    if (!apifyData || apifyData.length === 0) {
      throw new Error('No video data found for this Instagram URL');
    }

    const videoData = apifyData[0];

    return new Response(JSON.stringify({
      success: true,
      videoUrl: videoData.video_url,
      caption: videoData.caption,
      metadata: {
        likes: videoData.likes,
        comments: videoData.comments,
        owner_username: videoData.owner_username
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Instagram video extraction error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});