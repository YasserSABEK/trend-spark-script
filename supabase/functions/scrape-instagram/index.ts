import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApifyInstagramPost {
  displayUrl: string;
  caption: string;
  ownerFullName: string;
  ownerUsername: string;
  url: string;
  commentsCount: number;
  likesCount: number;
  timestamp: string;
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
      'https://api.apify.com/v2/acts/apify~instagram-scraper/runs',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/${username.replace('@', '')}`],
          resultsType: 'posts',
          resultsLimit: 50,
          searchLimit: 1,
          addParentData: false,
          enhanceUserSearchWithFacebookPage: false,
          isUserReelFeedURL: false,
          isUserTaggedFeedURL: false,
          onlyPostsNewerThan: "2024-07-01"
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

    // Filter for REELS ONLY and sort by engagement
    const processedResults = results
      .filter(post => {
        // Skip error entries and profile info
        if (post.error || !post.url || !post.id) return false;
        // ONLY VIDEO CONTENT (REELS)
        if (post.type !== 'Video') return false;
        // Must have video URL or productType indicating it's a reel
        if (!post.videoUrl && post.productType !== 'clips') return false;
        // Must have basic engagement metrics
        return typeof post.likesCount === 'number' && 
               typeof post.commentsCount === 'number';
      })
      .sort((a, b) => (b.videoViewCount || b.likesCount || 0) - (a.videoViewCount || a.likesCount || 0))
      .map(post => {
        const postId = post.shortCode || post.url.split('/p/')[1]?.split('/')[0] || '';
        const thumbnailUrl = post.displayUrl || (post.images && post.images[0]) || '';
        const videoUrl = post.videoUrl;
        
        return {
          id: `apify-${Date.now()}-${Math.random()}`,
          post_id: postId,
          url: post.url,
          caption: post.caption || '',
          hashtags: extractHashtags(post.caption || ''),
          username: post.ownerUsername,
          display_name: post.ownerFullName,
          followers: 0, // Not available in this data
          verified: false, // Not available in this data
          likes: post.likesCount || 0,
          comments: post.commentsCount || 0,
          video_view_count: post.videoViewCount || post.videoPlayCount || (post.likesCount * 10) || 0,
          viral_score: calculateViralScore(post.likesCount || 0, post.commentsCount || 0, post.videoViewCount || 0),
          engagement_rate: calculateEngagementRate(post.likesCount || 0, post.commentsCount || 0),
          timestamp: post.timestamp,
          scraped_at: new Date().toISOString(),
          thumbnail_url: thumbnailUrl,
          video_url: videoUrl,
          video_duration: post.videoDuration || null,
          product_type: post.productType || 'clips',
          is_video: true,
          search_username: username
        };
      });

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

function calculateViralScore(likes: number, comments: number, views: number = 0): number {
  // Enhanced viral score calculation for reels
  const engagementScore = likes + (comments * 15) + (views * 0.1);
  return Math.min(100, Math.floor(engagementScore / 2000));
}

function calculateEngagementRate(likes: number, comments: number): number {
  // Simplified engagement rate calculation
  const totalEngagement = likes + comments;
  return Math.min(15, totalEngagement / 1000);
}