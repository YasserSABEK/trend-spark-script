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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');

    // Enhanced environment validation and logging
    const allEnvKeys = Object.keys(Deno.env.toObject()).filter(key => 
      key.includes('APIFY') || key.includes('API')
    );
    
    console.log('🔍 Environment check for search-tiktok-creators:');
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
    console.log('- APIFY_API_KEY exists:', !!apifyApiKey);
    console.log('- APIFY_API_KEY length:', apifyApiKey ? apifyApiKey.length : 0);
    console.log('- APIFY_API_KEY prefix:', apifyApiKey ? apifyApiKey.substring(0, 15) + '...' : 'NOT_FOUND');
    console.log('- All API-related env keys:', allEnvKeys);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  if (!apifyApiKey) {
    console.error('❌ APIFY_API_KEY not found in environment variables');
    console.error('Available environment keys:', Object.keys(Deno.env.toObject()));
    
    return new Response(JSON.stringify({
      error: 'TikTok creator search temporarily unavailable. API key not configured.',
      code: 'MISSING_API_KEY',
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
    
    console.log('✅ All environment variables found, proceeding with TikTok creator search...');
    
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
    const { data: creditResult, error: creditError } = await supabase.rpc('spend_credits', {
      user_id_param: user.id,
      amount_param: 1,
      reason_param: 'tiktok_creator_search',
      ref_type_param: 'search',
      ref_id_param: searchId || query
    });

    if (creditError || !creditResult?.ok) {
      console.error('❌ Credit deduction failed:', creditError || creditResult);
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits. Please check your billing page.',
        code: 'INSUFFICIENT_CREDITS',
        details: creditResult?.error || creditError?.message
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
      resultsPerPage: 80,
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

    // Phase 1: Extract all creators first (inclusive approach)
    const creatorMap = new Map<string, any>();
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    
    console.log(`Processing ${posts.length} total posts to extract creators`);

    // First pass: Collect all creators and their content
    posts.forEach((post: any) => {
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
          all_posts: [],
          viral_posts: [],
          recent_posts: [],
          total_views: 0,
          last_seen_at: createdAt
        });
      }

      const creator = creatorMap.get(username);
      const postData = {
        url: post.webVideoUrl || `https://www.tiktok.com/@${username}/video/${post.id}`,
        views,
        created_at: createdAt
      };

      // Add to all posts
      creator.all_posts.push(postData);
      creator.total_views += views;

      // Categorize posts
      const isRecent = createdAt >= sixMonthsAgo;
      const isViral = views >= 50000; // Lowered threshold from 100k to 50k

      if (isRecent) {
        creator.recent_posts.push(postData);
      }
      
      if (isViral) {
        creator.viral_posts.push(postData);
      }

      if (createdAt > new Date(creator.last_seen_at)) {
        creator.last_seen_at = createdAt;
      }
    });

    console.log(`Found ${creatorMap.size} unique creators from ${posts.length} posts`);

    // Second pass: Filter out creators with no meaningful content
    const filteredCreators = Array.from(creatorMap.values()).filter(creator => {
      // Include creators with at least one of these criteria:
      // 1. Has viral content (50k+ views)
      // 2. Has recent activity (last 6 months) with decent engagement (10k+ views)
      // 3. Has consistent posting (5+ posts) with moderate engagement
      const hasViralContent = creator.viral_posts.length > 0;
      const hasRecentActivity = creator.recent_posts.length > 0 && 
        creator.recent_posts.some((p: any) => p.views >= 10000);
      const hasConsistentPosting = creator.all_posts.length >= 5 && 
        creator.total_views / creator.all_posts.length >= 5000;

      return hasViralContent || hasRecentActivity || hasConsistentPosting;
    });

    console.log(`Filtered to ${filteredCreators.length} creators meeting inclusion criteria`);

    // Calculate final metrics for each creator
    const creators: Creator[] = filteredCreators.map(creator => {
      const allViews = creator.all_posts.map((p: any) => p.views).sort((a: number, b: number) => a - b);
      const viralPosts = creator.viral_posts;
      
      // Use best posts for sample (mix of viral and recent)
      const bestPosts = [...creator.viral_posts, ...creator.recent_posts]
        .sort((a: any, b: any) => b.views - a.views)
        .slice(0, 3);
      
      return {
        username: creator.username,
        display_name: creator.display_name,
        avatar_url: creator.avatar_url,
        follower_count: creator.follower_count,
        viral_post_count: viralPosts.length,
        median_views: allViews.length > 0 ? allViews[Math.floor(allViews.length / 2)] : 0,
        max_views: allViews.length > 0 ? Math.max(...allViews) : 0,
        total_views: creator.total_views,
        last_seen_at: creator.last_seen_at.toISOString(),
        profile_url: creator.profile_url,
        sample_posts: bestPosts.map((p: any) => ({ url: p.url, views: p.views }))
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
      videos_processed_count: posts.length,
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