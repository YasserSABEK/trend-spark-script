import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-OR-SCRAPE-SEARCH] ${step}${detailsStr}`);
};

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/^#/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { type, query, page = 1, platform = 'tiktok' } = await req.json();
    logStep("Request parameters", { type, query, page, platform });

    // Generate cache key
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = `${platform}:${type}:${normalizedQuery}:page${page}`;
    logStep("Cache key generated", { cacheKey });

    // Check for existing cache (within 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: cachedData, error: cacheError } = await supabaseClient
      .from('search_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .eq('user_id', user.id)
      .gte('fetched_at', tenMinutesAgo)
      .single();

    if (!cacheError && cachedData) {
      logStep("Cache hit - returning cached data");
      return new Response(JSON.stringify({
        source: 'cache',
        charge: false,
        items: cachedData.items,
        total_count: cachedData.total_count,
        refreshing: false,
        cache_key: cacheKey
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    logStep("Cache miss - need to scrape new data");

    // Check for stale cache (older than 10 minutes but exists)
    const { data: staleData } = await supabaseClient
      .from('search_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .eq('user_id', user.id)
      .single();

    // Spend credits for fresh data
    const { data: spendResult, error: spendError } = await supabaseClient
      .rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: 1,
        reason_param: 'search_chunk',
        ref_type_param: type,
        ref_id_param: cacheKey,
        idempotency_key_param: cacheKey
      });

    if (spendError) {
      logStep("Error spending credits", { error: spendError.message });
      throw new Error(`Credit error: ${spendError.message}`);
    }

    if (!spendResult.ok) {
      logStep("Insufficient credits", { currentBalance: spendResult.current_balance });
      return new Response(JSON.stringify({
        error: 'INSUFFICIENT_CREDITS',
        current_balance: spendResult.current_balance || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 402,
      });
    }

    logStep("Credits spent successfully", { newBalance: spendResult.new_balance });

    // If we have stale data, return it immediately and refresh in background
    if (staleData) {
      logStep("Returning stale data with background refresh");
      
      // Start background refresh (don't await)
      refreshCacheInBackground(supabaseClient, type, normalizedQuery, page, platform, cacheKey, user.id);
      
      return new Response(JSON.stringify({
        source: 'stale',
        charge: true,
        items: staleData.items,
        total_count: staleData.total_count,
        refreshing: true,
        new_balance: spendResult.new_balance,
        cache_key: cacheKey
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // No cache at all - scrape fresh data
    const scrapedData = await scrapeData(type, normalizedQuery, page, platform);
    logStep("Data scraped", { itemCount: scrapedData.items.length });

    // Store in cache
    await supabaseClient
      .from('search_cache')
      .upsert({
        cache_key: cacheKey,
        user_id: user.id,
        chunk_size: 50,
        items: scrapedData.items,
        total_count: scrapedData.total_count,
        fetched_at: new Date().toISOString(),
        source_run_id: scrapedData.run_id
      });

    logStep("Data cached successfully");

    return new Response(JSON.stringify({
      source: 'fresh',
      charge: true,
      items: scrapedData.items,
      total_count: scrapedData.total_count,
      refreshing: false,
      new_balance: spendResult.new_balance,
      cache_key: cacheKey
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function refreshCacheInBackground(
  supabaseClient: any,
  type: string,
  query: string,
  page: number,
  platform: string,
  cacheKey: string,
  userId: string
) {
  try {
    logStep("Starting background refresh");
    const scrapedData = await scrapeData(type, query, page, platform);
    
    await supabaseClient
      .from('search_cache')
      .upsert({
        cache_key: cacheKey,
        user_id: userId,
        chunk_size: 50,
        items: scrapedData.items,
        total_count: scrapedData.total_count,
        fetched_at: new Date().toISOString(),
        source_run_id: scrapedData.run_id
      });
    
    logStep("Background refresh completed");
  } catch (error) {
    logStep("Background refresh failed", { error: error.message });
  }
}

async function scrapeData(type: string, query: string, page: number, platform: string) {
  // Mock implementation - replace with actual Apify scraping logic
  logStep("Mock scraping data", { type, query, page, platform });
  
  // Generate mock data for demonstration
  const mockItems = Array.from({ length: 50 }, (_, i) => ({
    id: `${platform}_${type}_${query}_${page}_${i}`,
    url: `https://${platform}.com/video/${i}`,
    thumbnail_url: `https://via.placeholder.com/300x400?text=Video+${i}`,
    caption: `Mock ${type} content for ${query} - item ${i}`,
    likes: Math.floor(Math.random() * 10000),
    comments: Math.floor(Math.random() * 1000),
    shares: Math.floor(Math.random() * 500),
    platform: platform,
    scraped_at: new Date().toISOString()
  }));

  return {
    items: mockItems,
    total_count: 500, // Mock total
    run_id: `mock_run_${Date.now()}`
  };
}