import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if APIFY_API_KEY is available
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    
    console.log('🔍 Environment check for scrape-instagram-hashtags:');
    console.log('- APIFY_API_KEY exists:', !!apifyApiKey);
    console.log('- APIFY_API_KEY length:', apifyApiKey ? apifyApiKey.length : 0);
    console.log('- APIFY_API_KEY prefix:', apifyApiKey ? apifyApiKey.substring(0, 15) + '...' : 'NOT_FOUND');
    console.log('- APIFY_API_KEY trimmed length:', apifyApiKey ? apifyApiKey.trim().length : 0);
    console.log('- SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    console.log('- All API-related env keys:', Object.keys(Deno.env.toObject()).filter(key => 
      key.includes('APIFY') || key.includes('API')
    ));
    
    if (!apifyApiKey || apifyApiKey.trim() === '') {
      console.error('❌ APIFY_API_KEY not found or empty in environment variables');
      console.log('Available environment keys:', Object.keys(Deno.env.toObject()));
      
      return new Response(JSON.stringify({
        code: 'MISSING_API_KEY',
        error: 'Apify API key not configured or empty. Please contact support.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { hashtag, limit = 30 } = await req.json();
    
    if (!hashtag) {
      return new Response(JSON.stringify({ error: 'Hashtag is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct credits first
    const creditCost = 5;
    const { data: creditResult, error: creditError } = await supabase.rpc('spend_credits', {
      user_id_param: user.id,
      amount_param: creditCost,
      reason_param: 'instagram_hashtag_scraping',
      ref_type_param: 'hashtag',
      ref_id_param: hashtag
    });

    if (creditError) {
      console.error('Credit deduction error:', creditError);
      return new Response(JSON.stringify({
        code: 'CREDIT_ERROR',
        error: 'Failed to process credits'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!creditResult?.ok) {
      return new Response(JSON.stringify({
        code: 'INSUFFICIENT_CREDITS',
        error: 'Insufficient credits to perform this operation',
        current_balance: creditResult?.current_balance || 0
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Credits deducted successfully. New balance: ${creditResult.new_balance}`);

    try {
      // Create the Apify run
      const apifyResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hashtags: [hashtag],
          resultsLimit: limit,
          addParentData: false
        }),
      });

      if (!apifyResponse.ok) {
        console.error('Apify API error:', apifyResponse.status, apifyResponse.statusText);
        
        // Refund credits on API failure
        await supabase.rpc('spend_credits', {
          user_id_param: user.id,
          amount_param: -creditCost,
          reason_param: 'instagram_hashtag_scraping_refund',
          ref_type_param: 'hashtag',
          ref_id_param: hashtag
        });
        
        throw new Error(`Apify API error: ${apifyResponse.statusText}`);
      }

      const runData = await apifyResponse.json();
      console.log('Apify run created:', runData.id);

      // Wait for the run to complete
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs/${runData.id}`, {
          headers: {
            'Authorization': `Bearer ${apifyApiKey}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        console.log(`Run status: ${statusData.data.status}`);

        if (statusData.data.status === 'SUCCEEDED') {
          // Get the results
          const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items`, {
            headers: {
              'Authorization': `Bearer ${apifyApiKey}`,
            },
          });

          if (!resultsResponse.ok) {
            throw new Error(`Failed to fetch results: ${resultsResponse.statusText}`);
          }

          const results = await resultsResponse.json();
          console.log(`✅ Retrieved ${results.length} hashtag results`);

          return new Response(JSON.stringify({ 
            success: true, 
            data: results,
            credits_used: creditCost,
            remaining_credits: creditResult.new_balance
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (statusData.data.status === 'FAILED') {
          // Refund credits on scraping failure
          await supabase.rpc('spend_credits', {
            user_id_param: user.id,
            amount_param: -creditCost,
            reason_param: 'instagram_hashtag_scraping_refund',
            ref_type_param: 'hashtag',
            ref_id_param: hashtag
          });
          
          throw new Error('Scraping job failed');
        }

        attempts++;
      }

      // Timeout - refund credits
      await supabase.rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: -creditCost,
        reason_param: 'instagram_hashtag_scraping_refund',
        ref_type_param: 'hashtag',
        ref_id_param: hashtag
      });
      
      throw new Error('Scraping job timed out');

    } catch (scrapingError) {
      console.error('Scraping error:', scrapingError);
      
      return new Response(JSON.stringify({
        code: 'SCRAPING_ERROR',
        error: scrapingError.message || 'Failed to scrape Instagram hashtag'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});