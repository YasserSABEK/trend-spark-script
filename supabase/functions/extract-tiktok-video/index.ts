import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const apifyApiKey = Deno.env.get('APIFY_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tiktokUrl } = await req.json();

    if (!tiktokUrl) {
      return new Response('TikTok URL is required', { status: 400 });
    }

    if (!apifyApiKey) {
      return new Response('Apify API key not configured', { status: 500 });
    }

    console.log('Extracting TikTok video for:', tiktokUrl);

    // Use the specific actor provided by the user
    const actorId = 'thenetaji/tiktok-video-downloader';
    
    const runInput = {
      format: "default",
      quality: "best",
      urls: [
        {
          url: tiktokUrl,
          method: "GET"
        }
      ],
      concurrency: 7,
      proxy: {
        useApifyProxy: true
      }
    };

    // Start the actor run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync?token=${apifyApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(runInput),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify API error:', errorText);
      throw new Error(`Failed to start Apify actor: ${errorText}`);
    }

    const runData = await runResponse.json();
    
    // For synchronous runs, the result is directly available
    if (runData.output && runData.output.length > 0 && runData.output[0].downloadURL) {
      console.log('Successfully extracted TikTok video URL:', runData.output[0].downloadURL);
      return new Response(JSON.stringify({
        success: true,
        videoUrl: runData.output[0].downloadURL,
        title: runData.output[0].title || 'TikTok Video'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no output in sync response, fall back to async method
    const runId = runData.id;
    console.log('Started Apify run:', runId);

    // Poll for completion (max 60 seconds)
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2 seconds = 60 seconds timeout
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyApiKey}`);
      const statusData = await statusResponse.json();
      
      console.log(`Run status (attempt ${attempts + 1}):`, statusData.data.status);
      
      if (statusData.data.status === 'SUCCEEDED') {
        // Get the results
        const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyApiKey}`);
        const results = await resultsResponse.json();
        
        if (results && results.length > 0 && results[0].downloadURL) {
          console.log('Successfully extracted TikTok video URL:', results[0].downloadURL);
          return new Response(JSON.stringify({
            success: true,
            videoUrl: results[0].downloadURL,
            title: results[0].title
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          throw new Error('No video URL found in results');
        }
      } else if (statusData.data.status === 'FAILED') {
        throw new Error('Apify actor run failed');
      }
      
      attempts++;
    }

    throw new Error('Timeout waiting for video extraction to complete');

  } catch (error) {
    console.error('Error in extract-tiktok-video:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});