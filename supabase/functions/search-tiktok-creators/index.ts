import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Creator {
  username: string;
  display_name: string;
  avatar_url: string;
  follower_count?: number;
  viral_post_count: number;
  median_views: number;
  max_views: number;
  total_views: number;
  last_seen_at: string;
  profile_url: string;
  sample_posts: Array<{
    url: string;
    views: number;
  }>;
}

interface CacheData {
  query: string;
  creators: Creator[];
  creators_count: number;
  videos_processed_count: number;
  last_run_source: string;
  last_run_at: string;
  cached_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apifyApiKey = Deno.env.get('APIFY_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { query, searchId, getUserResults } = await req.json();

    // Authenticate user first
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If getUserResults is true, return cached data for a specific search
    if (getUserResults && searchId) {
      const cacheKey = `tiktok_creators_${searchId}`;
      const { data: cacheData } = await supabase
        .from('search_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .eq('user_id', user.id)
        .single();

      if (cacheData?.items) {
        return new Response(JSON.stringify(cacheData.items), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'No cached results found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize query
    const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
    const cacheKey = `tiktok_creators_${searchId || normalizedQuery}`;
    
    // Check cache first (10 minute freshness)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: cachedData } = await supabase
      .from('search_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .eq('user_id', user.id)
      .gte('fetched_at', tenMinutesAgo)
      .single();

    if (cachedData?.items) {
      console.log('Returning cached results for:', normalizedQuery);
      return new Response(JSON.stringify({
        ...cachedData.items,
        source: 'cache'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // User is already authenticated above, proceed with credit deduction

    // Check and deduct credits (only if no fresh cache)
    const { data: creditResult, error: creditError } = await supabase.rpc('safe_deduct_credits', {
      user_id_param: user.id,
      credits_to_deduct: 1
    });

    if (creditError || !creditResult?.success) {
      return new Response(JSON.stringify({ 
        error: creditResult?.message || 'Insufficient credits' 
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Starting TikTok creator search for:', normalizedQuery);
    
    // Update search status to running
    if (searchId) {
      await supabase
        .from('search_queue')
        .update({ status: 'running' })
        .eq('id', searchId);
    }

    // Start Apify run
    const apifyInput = {
      searchQueries: [normalizedQuery],
      resultsPerPage: 100,
      excludePinnedPosts: false,
      shouldDownloadCovers: false,
      shouldDownloadSlideshowImages: false,
      shouldDownloadSubtitles: false,
      shouldDownloadVideos: false,
      shouldDownloadVideoCovers: false
    };

    const runResponse = await fetch('https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apifyInput),
    });

    if (!runResponse.ok) {
      throw new Error(`Failed to start Apify run: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    console.log('Started Apify run:', runData.data.id);

    // Poll for completion
    let runStatus = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 30;

    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      const statusResponse = await fetch(`https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/runs/${runData.data.id}`, {
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.data.status;
        console.log(`Run status (attempt ${attempts}): ${runStatus}`);
      }
    }

    if (runStatus !== 'SUCCEEDED') {
      throw new Error(`Apify run failed or timed out. Status: ${runStatus}`);
    }

    // Get dataset items
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items`, {
      headers: {
        'Authorization': `Bearer ${apifyApiKey}`,
      },
    });

    if (!datasetResponse.ok) {
      throw new Error('Failed to fetch dataset items');
    }

    const posts = await datasetResponse.json();
    console.log(`Retrieved ${posts.length} posts for query: ${normalizedQuery}`);

    // Filter posts by date (last 90 days) and views (min 100k for broader results)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const minViews = 100000;

    const filteredPosts = posts.filter((post: any) => {
      const postDate = new Date(post.createTimeISO || post.createTime * 1000);
      const views = post.playCount || post.stats?.playCount || 0;
      return postDate >= ninetyDaysAgo && views >= minViews;
    });

    console.log(`Filtered to ${filteredPosts.length} posts meeting criteria`);

    // Group by creator and aggregate metrics
    const creatorMap = new Map<string, any>();

    filteredPosts.forEach((post: any) => {
      const username = post.authorMeta?.name || post.author?.uniqueId;
      if (!username) return;

      const views = post.playCount || post.stats?.playCount || 0;
      const createdAt = new Date(post.createTimeISO || post.createTime * 1000);

      if (!creatorMap.has(username)) {
        creatorMap.set(username, {
          username,
          display_name: post.authorMeta?.nickName || post.author?.nickname || username,
          avatar_url: post.authorMeta?.avatar || post.author?.avatarLarger || '',
          follower_count: post.authorMeta?.fans || post.author?.followerCount,
          profile_url: `https://www.tiktok.com/@${username}`,
          posts: [],
          total_views: 0,
          last_seen_at: createdAt
        });
      }

      const creator = creatorMap.get(username);
      creator.posts.push({
        url: post.webVideoUrl || `https://www.tiktok.com/@${username}/video/${post.id}`,
        views,
        created_at: createdAt
      });
      creator.total_views += views;

      if (createdAt > new Date(creator.last_seen_at)) {
        creator.last_seen_at = createdAt;
      }
    });

    // Calculate final metrics for each creator
    const creators: Creator[] = Array.from(creatorMap.values()).map(creator => {
      const views = creator.posts.map((p: any) => p.views).sort((a: number, b: number) => a - b);
      const viralPosts = creator.posts; // Count all posts as viral posts since they already passed the view filter
      
      return {
        username: creator.username,
        display_name: creator.display_name,
        avatar_url: creator.avatar_url,
        follower_count: creator.follower_count,
        viral_post_count: viralPosts.length,
        median_views: views.length > 0 ? views[Math.floor(views.length / 2)] : 0,
        max_views: Math.max(...views),
        total_views: creator.total_views,
        last_seen_at: creator.last_seen_at.toISOString(),
        profile_url: creator.profile_url,
        sample_posts: creator.posts
          .sort((a: any, b: any) => b.views - a.views)
          .slice(0, 3)
          .map((p: any) => ({ url: p.url, views: p.views }))
      };
    });

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
      query: normalizedQuery,
      creators,
      creators_count: creators.length,
      videos_processed_count: filteredPosts.length,
      last_run_source: 'fresh',
      last_run_at: new Date().toISOString(),
      cached_at: new Date().toISOString()
    };

    // Cache the results
    await supabase
      .from('search_cache')
      .upsert({
        cache_key: cacheKey,
        user_id: user.id,
        items: result,
        total_count: creators.length,
        fetched_at: new Date().toISOString(),
        chunk_size: creators.length
      });

    // Update search record
    if (searchId) {
      await supabase
        .from('search_queue')
        .update({
          status: 'completed',
          total_results: creators.length,
          processing_time_seconds: Math.floor((Date.now() - Date.parse(runData.data.startedAt)) / 1000),
          completed_at: new Date().toISOString()
        })
        .eq('id', searchId);
    }

    console.log(`Completed search for ${normalizedQuery}: ${creators.length} creators found`);

    return new Response(JSON.stringify({
      ...result,
      source: 'fresh'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in search-tiktok-creators function:', error);
    
    // Update search record with error if searchId provided
    const body = await req.text();
    try {
      const { searchId } = JSON.parse(body);
      if (searchId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('search_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', searchId);
      }
    } catch (e) {
      console.error('Error updating search record:', e);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});