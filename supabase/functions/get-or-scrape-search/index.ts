import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SIMPLIFIED-SEARCH] ${step}${detailsStr}`);
};

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/^#/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error('User not authenticated');

    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const body = await req.json();
    const { type, query, page = 0, platform = 'tiktok' } = body;
    
    logStep("Request parsed", { type, query, page, platform });

    // Normalize query for cache key
    const normalizedQuery = normalizeQuery(query);
    
    // Spend credits immediately - no cache system
    const { data: spendResult, error: spendError } = await supabaseClient
      .rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: 1,
        reason_param: 'search_action',
        ref_type_param: type,
        ref_id_param: `${type}_${normalizedQuery}_${page}`,
        idempotency_key_param: `${user.id}_${type}_${normalizedQuery}_${page}_${Date.now()}`
      });

    if (spendError) {
      logStep("Credit spending failed", { error: spendError });
      throw spendError;
    }

    const spendResultData = spendResult as { ok: boolean; error?: string; new_balance: number };

    if (!spendResultData?.ok) {
      logStep("Insufficient credits", { error: spendResultData?.error });
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          current_balance: spendResultData?.new_balance || 0
        }), 
        { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep("Credits deducted successfully", { newBalance: spendResultData.new_balance });

    // Scrape fresh data immediately
    const scrapedData = await scrapeData(type, normalizedQuery, page, platform);
    
    logStep("Data scraped successfully", { itemCount: scrapedData.items?.length || 0 });

    return new Response(
      JSON.stringify({
        success: true,
        items: scrapedData.items || [],
        total_count: scrapedData.totalCount || 0,
        credits_used: 1,
        remaining_credits: spendResultData.new_balance,
        message: "Search completed successfully"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    logStep("Error occurred", { error: error.message });
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Simplified scraping function - replace with actual implementation
async function scrapeData(type: string, query: string, page: number, platform: string) {
  // This is a placeholder - in real implementation, this would call actual scraping services
  logStep("Scraping data", { type, query, page, platform });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data for now
  const mockItems = Array.from({ length: 50 }, (_, i) => ({
    id: `${type}_${query}_${page}_${i}`,
    title: `${type} result ${i + 1} for "${query}"`,
    url: `https://example.com/${type}/${i}`,
    platform: platform,
    engagement: Math.floor(Math.random() * 10000),
    created_at: new Date().toISOString()
  }));

  return {
    items: mockItems,
    totalCount: 1000 + (page * 50),
    runId: `run_${Date.now()}`
  };
}