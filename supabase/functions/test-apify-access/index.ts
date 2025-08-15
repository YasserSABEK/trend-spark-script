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
    console.log('🔍 Testing APIFY_API_KEY access...');
    
    // Check if APIFY_API_KEY is available
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      apifyKeyExists: !!apifyApiKey,
      apifyKeyLength: apifyApiKey ? apifyApiKey.length : 0,
      apifyKeyPrefix: apifyApiKey ? apifyApiKey.substring(0, 10) + '...' : 'NOT_FOUND',
      environment: {
        supabaseUrl: !!Deno.env.get('SUPABASE_URL'),
        supabaseServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        supabaseAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
      },
      allEnvKeys: Object.keys(Deno.env.toObject()).filter(key => 
        key.includes('APIFY') || key.includes('API')
      )
    };

    console.log('📊 Environment Diagnostics:', JSON.stringify(diagnostics, null, 2));

    // Test actual Apify API call if key exists
    let apifyTestResult = null;
    if (apifyApiKey) {
      try {
        console.log('🧪 Testing Apify API call...');
        const testResponse = await fetch('https://api.apify.com/v2/acts', {
          headers: {
            'Authorization': `Bearer ${apifyApiKey}`,
          },
        });
        
        apifyTestResult = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          success: testResponse.ok
        };
        
        console.log('✅ Apify API test result:', apifyTestResult);
      } catch (error) {
        apifyTestResult = {
          error: error.message,
          success: false
        };
        console.error('❌ Apify API test failed:', error);
      }
    }

    const result = {
      success: true,
      diagnostics,
      apifyTestResult,
      message: apifyApiKey ? 'APIFY_API_KEY found and tested' : 'APIFY_API_KEY not found in environment'
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});