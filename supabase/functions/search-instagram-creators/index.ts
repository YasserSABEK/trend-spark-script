import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Creator {
  username: string;
  profile_url: string;
  avatar_url: string;
  follower_count: number;
  posts_count: number;
  verified: boolean;
  is_business: boolean;
  full_name: string;
  biography: string;
  external_url: string;
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apifyApiKey = Deno.env.get('APIFY_API_KEY');

  // Enhanced environment validation and logging
  const allEnvKeys = Object.keys(Deno.env.toObject()).filter(key => 
    key.includes('APIFY') || key.includes('API')
  );
  
  console.log('🔍 Environment check for search-instagram-creators:');
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
      error: 'Search service temporarily unavailable. API key not configured.',
      code: 'MISSING_API_KEY',
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  console.log('✅ All environment variables found, proceeding with search...');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { query, searchId, getUserResults } = await req.json();

    // Get auth header for user context first
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

    // If requesting cached results for a specific search
    if (getUserResults && searchId) {
      const cacheKey = `instagram:creators:${searchId}:results`;
      const { data: cacheData } = await supabase
        .from('search_cache')
        .select('items')
        .eq('cache_key', cacheKey)
        .eq('user_id', user.id)
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
      .eq('user_id', user.id)
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

    // User is already authenticated above, proceed with credit deduction

    // Deduct credits using spend_credits function
    const { data: creditResult, error: creditError } = await supabase
      .rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: 1,
        reason_param: 'instagram_creator_search',
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting Instagram creator search for:', query);

    // Configure Apify actor input for Instagram Search Scraper
    const actorInput = {
      enhanceUserSearchWithFacebookPage: false,
      search: query,
      searchLimit: 100,
      searchType: "user"
    };

    // Start Apify run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-search-scraper/runs?token=${apifyApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorInput),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify run failed:', runResponse.status, runResponse.statusText, errorText);
      throw new Error(`Failed to start Apify run: ${runResponse.statusText} - ${errorText}`);
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
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-search-scraper/runs/${runId}?token=${apifyApiKey}`);
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
    const profiles = await datasetResponse.json();

    console.log(`Processing ${profiles.length} Instagram profiles`);

    // Process Instagram creator profiles directly
    const creators: Creator[] = profiles
      .filter((profile: any) => profile.username && !profile.private) // Filter out private accounts
      .map((profile: any) => ({
        username: profile.username,
        profile_url: profile.url || `https://www.instagram.com/${profile.username}/`,
        avatar_url: profile.profilePicUrlHD || profile.profilePicUrl || '',
        follower_count: profile.followersCount || 0,
        posts_count: profile.postsCount || 0,
        verified: profile.verified || false,
        is_business: profile.isBusinessAccount || false,
        full_name: profile.fullName || '',
        biography: profile.biography || '',
        external_url: profile.externalUrl || ''
      }))
      .sort((a: Creator, b: Creator) => {
        // Sort by follower count (descending), then by verified status, then by posts count
        if (b.follower_count !== a.follower_count) {
          return b.follower_count - a.follower_count;
        }
        if (b.verified !== a.verified) {
          return b.verified ? 1 : -1;
        }
        return b.posts_count - a.posts_count;
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
        user_id: user.id,
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
          user_id: user.id,
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
      const requestBody = await req.text();
      const requestData = JSON.parse(requestBody);
      if (requestData.searchId) {
        const { error: updateError } = await supabase
          .from('search_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', requestData.searchId);
        
        if (updateError) {
          console.error('Error updating search status:', updateError);
        }
      }
    } catch (updateError) {
      console.error('Error parsing request for status update:', updateError);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});