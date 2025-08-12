import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { hashtag } = await req.json();

    if (!hashtag) {
      return new Response(
        JSON.stringify({ error: 'Hashtag is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use secure credit deduction with proper validation
    const { data: creditResult, error: creditError } = await supabaseClient.rpc(
      'safe_deduct_credits',
      { user_id_param: user.id, credits_to_deduct: 2 }
    );

    if (creditError) {
      console.error('❌ Credit deduction error:', creditError);
      return new Response(
        JSON.stringify({ error: 'Failed to process credits' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!creditResult.success) {
      console.log('❌ Insufficient credits for user:', user.id, creditResult.message);
      return new Response(
        JSON.stringify({ 
          error: creditResult.message,
          remaining_credits: creditResult.remaining_credits 
        }),
        { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Credits deducted successfully for user:', user.id, 'Remaining:', creditResult.remaining_credits);

    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    if (!apifyApiKey) {
      return new Response(
        JSON.stringify({ error: 'Apify API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Clean hashtag (remove # if present)
    const cleanHashtag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;

    console.log(`Starting hashtag scrape for: ${cleanHashtag}`);

    // Configure Apify actor for hashtag scraping
    const actorConfig = {
      addParentData: false,
      directUrls: [`https://www.instagram.com/explore/tags/${cleanHashtag}`],
      enhanceUserSearchWithFacebookPage: false,
      isUserReelFeedURL: false,
      isUserTaggedFeedURL: false,
      onlyPostsNewerThan: "2024-08-01",
      resultsLimit: 200,
      resultsType: "stories",
      searchLimit: 1,
      searchType: "hashtag"
    };

    // Start Apify actor run
    const actorResponse = await fetch(
      'https://api.apify.com/v2/acts/apify~instagram-scraper/runs',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actorConfig),
      }
    );

    if (!actorResponse.ok) {
      const errorText = await actorResponse.text();
      console.error('Apify actor start failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to start scraping job' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const runData = await actorResponse.json();
    const runId = runData.data.id;
    console.log(`Started Apify run: ${runId}`);

    // Add to search queue
    const { data: searchQueueData, error: queueError } = await supabaseClient
      .from('search_queue')
      .insert({
        user_id: user.id,
        username: cleanHashtag, // Using username field for hashtag name
        hashtag: cleanHashtag,
        search_type: 'hashtag',
        platform: 'instagram',
        status: 'processing',
      })
      .select()
      .single();

    if (queueError) {
      console.error('Error adding to search queue:', queueError);
    }

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-scraper/runs/${runId}`,
        {
          headers: { 'Authorization': `Bearer ${apifyApiKey}` },
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`Run status (attempt ${attempts}):`, statusData.data.status);

        if (statusData.data.status === 'SUCCEEDED') {
          console.log('Run completed successfully');
          
          // Get dataset items
          const datasetResponse = await fetch(
            `https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items`,
            {
              headers: { 'Authorization': `Bearer ${apifyApiKey}` },
            }
          );

          if (datasetResponse.ok) {
            const posts = await datasetResponse.json();
            console.log(`Retrieved ${posts.length} posts for hashtag: ${cleanHashtag}`);

            // Process and filter posts for Reels from the last year
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const processedPosts = posts
              .filter((post: any) => {
                // Filter for video content and recent posts
                const postDate = new Date(post.timestamp);
                return (post.type === 'Video' && post.productType === 'clips') && postDate >= oneYearAgo;
              })
              .map((post: any) => ({
                post_id: post.id || post.shortCode,
                url: post.url,
                shortcode: post.shortCode,
                caption: post.caption || '',
                hashtags: post.hashtags || extractHashtags(post.caption || ''),
                mentions: post.mentions || [],
                username: post.ownerUsername,
                display_name: post.ownerFullName,
                followers: null,
                verified: false, // Not available in new format
                likes: 0, // Not available in new format
                comments: post.commentsCount || 0,
                video_view_count: post.videoPlayCount || post.igPlayCount || 0,
                video_play_count: post.videoPlayCount || post.igPlayCount || 0,
                viral_score: calculateViralScore(
                  0, // likes not available
                  post.commentsCount || 0,
                  post.videoPlayCount || post.igPlayCount || 0
                ),
                engagement_rate: calculateEngagementRate(
                  0, // likes not available
                  post.commentsCount || 0
                ),
                timestamp: post.timestamp,
                thumbnail_url: post.displayUrl,
                video_url: post.videoUrl,
                video_duration: post.videoDuration,
                is_video: true,
                search_hashtag: cleanHashtag,
                search_status: 'completed',
                product_type: post.productType || 'clips',
                user_id: user.id, // Add user association for RLS
              }));

            // Insert posts into database
            if (processedPosts.length > 0) {
              const { error: insertError } = await supabaseClient
                .from('instagram_reels')
                .insert(processedPosts);

              if (insertError) {
                console.error('Error inserting posts:', insertError);
              } else {
                console.log(`Inserted ${processedPosts.length} posts`);
              }
            }

            // Update search queue status
            if (searchQueueData) {
              await supabaseClient
                .from('search_queue')
                .update({
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                  total_results: processedPosts.length,
                })
                .eq('id', searchQueueData.id);
            }

            return new Response(
              JSON.stringify({
                success: true,
                hashtag: cleanHashtag,
                totalPosts: processedPosts.length,
                posts: processedPosts.slice(0, 20), // Return first 20 for immediate display
              }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
        } else if (statusData.data.status === 'FAILED') {
          throw new Error('Scraping job failed');
        }
      }
    }

    // Timeout
    if (searchQueueData) {
      await supabaseClient
        .from('search_queue')
        .update({
          status: 'failed',
          error_message: 'Timeout waiting for scraping to complete',
        })
        .eq('id', searchQueueData.id);
    }

    return new Response(
      JSON.stringify({ error: 'Timeout waiting for scraping to complete' }),
      { 
        status: 408, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in hashtag scraping:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions
function extractHashtags(caption: string): string[] {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  return caption.match(hashtagRegex) || [];
}

function calculateViralScore(likes: number, comments: number, views: number = 0): number {
  const engagement = likes + (comments * 3);
  const viewRatio = views > 0 ? engagement / views : 0;
  return Math.floor((engagement * 0.7) + (viewRatio * 100 * 0.3));
}

function calculateEngagementRate(likes: number, comments: number): number {
  const totalEngagement = likes + comments;
  return parseFloat((totalEngagement * 0.1).toFixed(2)); // Simplified calculation
}