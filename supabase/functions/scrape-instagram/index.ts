import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApifyInstagramPost {
  inputUrl: string;
  id: string;
  type: string;
  shortCode: string;
  caption: string;
  hashtags: string[];
  mentions: string[];
  url: string;
  commentsCount: number;
  firstComment: string;
  latestComments: any[];
  dimensionsHeight: number;
  dimensionsWidth: number;
  displayUrl: string;
  images: any[];
  videoUrl: string;
  alt: string | null;
  likesCount: number;
  videoViewCount: number;
  videoPlayCount: number | null;
  timestamp: string;
  childPosts: any[];
  locationName: string;
  locationId: string;
  ownerFullName: string;
  ownerUsername: string;
  ownerId: string;
  productType: string;
  videoDuration: number;
  isSponsored: boolean;
  taggedUsers: any[];
  isCommentsDisabled: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    if (!apifyApiKey) {
      console.error('APIFY_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting Instagram scrape for username: ${username}`);

    // Start Apify actor run
    const actorRunResponse = await fetch(
      'https://api.apify.com/v2/acts/apify/instagram-scraper/runs',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addParentData: false,
          directUrls: [`https://www.instagram.com/${username.startsWith('@') ? username.slice(1) : username}`],
          enhanceUserSearchWithFacebookPage: false,
          isUserReelFeedURL: false,
          isUserTaggedFeedURL: false,
          resultsLimit: 30,
          resultsType: "stories",
          searchLimit: 1,
          searchType: "hashtag"
        }),
      }
    );

    if (!actorRunResponse.ok) {
      const errorText = await actorRunResponse.text();
      console.error('Apify actor run failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to start Instagram scraping' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const runData = await actorRunResponse.json();
    const runId = runData.data.id;

    console.log(`Actor run started with ID: ${runId}`);

    // Poll for completion (with timeout)
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes timeout
    let runStatus = 'RUNNING';

    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${apifyApiKey}`,
          },
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.data.status;
        console.log(`Run status: ${runStatus}, attempt: ${attempts + 1}`);
      }

      attempts++;
    }

    if (runStatus !== 'SUCCEEDED') {
      console.error(`Actor run did not succeed. Final status: ${runStatus}`);
      return new Response(
        JSON.stringify({ error: 'Instagram scraping timed out or failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
      {
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
        },
      }
    );

    if (!resultsResponse.ok) {
      console.error('Failed to fetch results');
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scraping results' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results: ApifyInstagramPost[] = await resultsResponse.json();
    console.log(`Received ${results.length} posts from Apify`);
    console.log('Sample post data:', JSON.stringify(results[0], null, 2));

    // Filter and sort by likes (most viewed approximation)
    const processedResults = results
      .filter(post => {
        console.log('Processing post:', {
          hasLikes: !!post.likesCount,
          hasDisplayUrl: !!post.displayUrl,
          hasCaption: !!post.caption,
          hasVideoUrl: !!post.videoUrl,
          type: post.type,
          error: post.error || 'none'
        });
        // Filter out error posts and ensure we have basic required data
        return post.type === 'Video' && post.displayUrl && post.caption && !post.error;
      })
      .sort((a, b) => (b.videoViewCount || b.likesCount || 0) - (a.videoViewCount || a.likesCount || 0))
      .map(post => ({
        id: `apify-${Date.now()}-${Math.random()}`,
        post_id: post.shortCode || post.id,
        url: post.url,
        caption: post.caption || '',
        hashtags: post.hashtags || extractHashtags(post.caption || ''),
        username: post.ownerUsername || '',
        display_name: post.ownerFullName || '',
        followers: 0, // Not available in this data
        verified: false, // Not available in this data
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0,
        video_view_count: post.videoViewCount || (post.likesCount || 0) * 10,
        viral_score: calculateViralScore(post.likesCount || 0, post.commentsCount || 0),
        engagement_rate: calculateEngagementRate(post.likesCount || 0, post.commentsCount || 0),
        timestamp: post.timestamp || new Date().toISOString(),
        scraped_at: new Date().toISOString(),
        thumbnail_url: post.displayUrl,
      }));

    console.log(`Processed ${processedResults.length} posts, sending response`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: processedResults,
        total: processedResults.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in scrape-instagram function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function extractHashtags(caption: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  return caption.match(hashtagRegex) || [];
}

function calculateViralScore(likes: number, comments: number): number {
  // Simple viral score calculation
  const engagementScore = likes + (comments * 10);
  return Math.min(100, Math.floor(engagementScore / 1000));
}

function calculateEngagementRate(likes: number, comments: number): number {
  // Simplified engagement rate calculation
  const totalEngagement = likes + comments;
  return Math.min(15, totalEngagement / 1000);
}