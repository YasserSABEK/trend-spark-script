import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Creator {
  username: string;
  profile_url: string;
  avatar_url: string;
  follower_count: number;
  viral_post_count: number;
  median_views: number;
  max_views: number;
  total_views: number;
  last_posted_at: string;
  sample_posts: Array<{
    url: string;
    view_count: number;
  }>;
}

interface CacheData {
  creators: Creator[];
  query: string;
  search_completed_at: string;
  total_creators: number;
  source: 'cache' | 'fresh';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apifyApiKey = Deno.env.get('APIFY_API_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { query, searchId, getUserResults } = await req.json();

    // If requesting cached results for a specific search
    if (getUserResults && searchId) {
      const cacheKey = `instagram:creators:${searchId}:results`;
      const { data: cacheData } = await supabase
        .from('search_cache')
        .select('items')
        .eq('cache_key', cacheKey)
        .single();

      if (cacheData?.items) {
        return new Response(JSON.stringify(cacheData.items), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Results not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cache first (10 minute freshness)
    const cacheKey = `instagram:creators:${query.toLowerCase().replace(/\s+/g, '')}`;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: cacheData } = await supabase
      .from('search_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gte('created_at', tenMinutesAgo)
      .single();

    if (cacheData?.items) {
      console.log('Returning cached Instagram creators data');
      return new Response(JSON.stringify({
        ...cacheData.items,
        source: 'cache'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get auth header for credit deduction
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct credits using safe_deduct_credits function
    const { data: creditResult, error: creditError } = await supabase
      .rpc('safe_deduct_credits', {
        user_id_param: user.id,
        credits_to_deduct: 1
      });

    if (creditError || !creditResult?.success) {
      return new Response(JSON.stringify({ 
        error: creditResult?.message || 'Insufficient credits'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting Instagram creator search for:', query);

    // Prepare Instagram hashtag URL
    const hashtag = query.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const instagramUrl = `https://www.instagram.com/explore/tags/${hashtag}/`;

    // Configure Apify actor input for Instagram scraper
    const actorInput = {
      directUrls: [instagramUrl],
      resultsType: "stories",
      resultsLimit: 200,
      searchLimit: 1,
      addParentData: false,
      enhanceUserSearchWithFacebookPage: false,
      isUserReelFeedURL: false,
      isUserTaggedFeedURL: false,
      onlyPostsNewerThan: "2024-08-01"
    };

    // Start Apify run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${apifyApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorInput),
    });

    if (!runResponse.ok) {
      throw new Error(`Failed to start Apify run: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log('Started Apify run:', runId);

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/runs/${runId}?token=${apifyApiKey}`);
      const statusData = await statusResponse.json();
      
      console.log(`Apify run status: ${statusData.data.status}`);
      
      if (statusData.data.status === 'SUCCEEDED') {
        completed = true;
      } else if (statusData.data.status === 'FAILED') {
        throw new Error('Apify run failed');
      }
      
      attempts++;
    }

    if (!completed) {
      throw new Error('Apify run timed out');
    }

    // Get dataset items
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items?token=${apifyApiKey}`);
    const posts = await datasetResponse.json();

    console.log(`Processing ${posts.length} Instagram posts`);

    // Filter and process posts
    const validPosts = posts.filter((post: any) => 
      post.isVideo === true || 
      post.productType === 'clips' || 
      post.videoUrl
    );

    // Group by creator and calculate metrics
    const creatorStats = new Map<string, any>();
    const minViews = 1000000; // 1M views minimum
    const lookbackDays = 90;
    const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    for (const post of validPosts) {
      if (!post.ownerUsername) continue;
      
      const postDate = new Date(post.timestamp * 1000);
      if (postDate < cutoffDate) continue;
      
      const viewCount = post.videoViewCount || post.videoPlayCount || 0;
      if (viewCount < minViews) continue;

      const username = post.ownerUsername;
      
      if (!creatorStats.has(username)) {
        creatorStats.set(username, {
          username,
          profile_url: `https://www.instagram.com/${username}/`,
          avatar_url: post.ownerProfilePicUrl || '',
          follower_count: 0, // Will be enriched later if needed
          posts: [],
          total_views: 0,
          last_posted_at: postDate.toISOString()
        });
      }

      const creator = creatorStats.get(username);
      creator.posts.push({
        url: post.url,
        view_count: viewCount,
        timestamp: postDate.toISOString()
      });
      creator.total_views += viewCount;
      
      if (postDate > new Date(creator.last_posted_at)) {
        creator.last_posted_at = postDate.toISOString();
      }
    }

    // Calculate final metrics for each creator
    const creators: Creator[] = [];
    
    for (const [username, stats] of creatorStats) {
      if (stats.posts.length === 0) continue;
      
      const views = stats.posts.map((p: any) => p.view_count).sort((a: number, b: number) => a - b);
      const medianViews = views.length > 0 ? views[Math.floor(views.length / 2)] : 0;
      const maxViews = Math.max(...views);
      
      creators.push({
        username: stats.username,
        profile_url: stats.profile_url,
        avatar_url: stats.avatar_url,
        follower_count: stats.follower_count,
        viral_post_count: stats.posts.length,
        median_views: medianViews,
        max_views: maxViews,
        total_views: stats.total_views,
        last_posted_at: stats.last_posted_at,
        sample_posts: stats.posts.slice(0, 3).map((p: any) => ({
          url: p.url,
          view_count: p.view_count
        }))
      });
    }

    // Sort creators by viral post count, then median views, then max views
    creators.sort((a, b) => {
      if (b.viral_post_count !== a.viral_post_count) {
        return b.viral_post_count - a.viral_post_count;
      }
      if (b.median_views !== a.median_views) {
        return b.median_views - a.median_views;
      }
      return b.max_views - a.max_views;
    });

    const result: CacheData = {
      query,
      creators: creators.slice(0, 50), // Limit to top 50 creators
      total_creators: creators.length,
      search_completed_at: new Date().toISOString(),
      source: 'fresh'
    };

    // Cache the results
    await supabase
      .from('search_cache')
      .upsert({
        cache_key: cacheKey,
        items: result,
        fetched_at: new Date().toISOString(),
        total_count: creators.length
      });

    // Cache results for specific search ID
    if (searchId) {
      const searchCacheKey = `instagram:creators:${searchId}:results`;
      await supabase
        .from('search_cache')
        .upsert({
          cache_key: searchCacheKey,
          items: result,
          fetched_at: new Date().toISOString(),
          total_count: creators.length
        });
    }

    // Update search queue status
    if (searchId) {
      await supabase
        .from('search_queue')
        .update({
          status: 'completed',
          total_results: creators.length,
          completed_at: new Date().toISOString(),
          processing_time_seconds: Math.floor((Date.now() - new Date(runData.data.startedAt).getTime()) / 1000)
        })
        .eq('id', searchId);
    }

    console.log(`Instagram creator search completed: ${creators.length} creators found`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-instagram-creators:', error);
    
    // Update search queue status if we have a searchId
    try {
      const { searchId } = await req.json();
      if (searchId) {
        await supabase
          .from('search_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', searchId);
      }
    } catch (updateError) {
      console.error('Error updating search status:', updateError);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});