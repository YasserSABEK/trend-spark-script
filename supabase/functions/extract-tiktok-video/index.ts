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
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'TikTok URL is required' 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!apifyApiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Apify API key not configured' 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Extracting TikTok video for:', tiktokUrl);

    // Try different actors with different input formats
    const actors = [
      {
        id: 'clockworks/free-tiktok-scraper',
        input: { startUrls: [{ url: tiktokUrl }] }
      },
      {
        id: 'apify/tiktok-scraper', 
        input: { postURLs: [tiktokUrl] }
      },
      {
        id: 'dainty_screw/tiktok-scraper',
        input: { urls: [tiktokUrl] }
      }
    ];

    let lastError = null;
    
    for (const actor of actors) {
      try {
        console.log(`Trying actor: ${actor.id}`);
        
        // Start the actor run with correct input format
        const runResponse = await fetch(`https://api.apify.com/v2/acts/${actor.id}/run-sync?token=${apifyApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(actor.input),
        });

        if (!runResponse.ok) {
          const errorText = await runResponse.text();
          console.error(`Apify API error for ${actor.id}:`, errorText);
          lastError = `Failed to start Apify actor ${actor.id}: ${errorText}`;
          continue; // Try next actor
        }

        const runData = await runResponse.json();
        console.log(`Response from ${actor.id}:`, JSON.stringify(runData, null, 2));
        
        // For synchronous runs, check for direct output
        if (runData.output && runData.output.length > 0) {
          const result = runData.output[0];
          // Try different possible property names for video URL
          const videoUrl = result.downloadURL || result.videoUrl || result.video_url || result.directVideoUrl;
          if (videoUrl) {
            console.log(`Successfully extracted TikTok video URL from ${actor.id}:`, videoUrl);
            return new Response(JSON.stringify({
              success: true,
              videoUrl: videoUrl,
              title: result.title || result.text || 'TikTok Video',
              actor: actor.id
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // If no output in sync response, fall back to async method
        const runId = runData.id;
        if (runId) {
          console.log(`Started async Apify run for ${actor.id}:`, runId);

          // Poll for completion (max 30 seconds per actor)
          let attempts = 0;
          const maxAttempts = 15; // 15 * 2 seconds = 30 seconds timeout per actor
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyApiKey}`);
            const statusData = await statusResponse.json();
            
            console.log(`Run status for ${actor.id} (attempt ${attempts + 1}):`, statusData.data?.status);
            
            if (statusData.data?.status === 'SUCCEEDED') {
              // Get the results
              const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyApiKey}`);
              const results = await resultsResponse.json();
              
              if (results && results.length > 0) {
                const result = results[0];
                const videoUrl = result.downloadURL || result.videoUrl || result.video_url || result.directVideoUrl;
                if (videoUrl) {
                  console.log(`Successfully extracted TikTok video URL from async ${actor.id}:`, videoUrl);
                  return new Response(JSON.stringify({
                    success: true,
                    videoUrl: videoUrl,
                    title: result.title || result.text || 'TikTok Video',
                    actor: actor.id
                  }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  });
                }
              }
            } else if (statusData.data?.status === 'FAILED') {
              lastError = `Apify actor ${actor.id} run failed`;
              break; // Try next actor
            }
            
            attempts++;
          }
          
          if (attempts >= maxAttempts) {
            lastError = `Timeout waiting for ${actor.id} to complete`;
          }
        }
        
      } catch (error) {
        console.error(`Error with actor ${actor.id}:`, error);
        lastError = `Error with actor ${actor.id}: ${error.message}`;
        continue; // Try next actor
      }
    }

    // If all actors failed, return the last error
    throw new Error(lastError || 'All TikTok extraction actors failed');

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