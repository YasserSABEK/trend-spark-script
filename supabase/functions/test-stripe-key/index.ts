import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[TEST-STRIPE-KEY] Function started");
    
    // Get all environment variables
    const allEnvVars = Object.keys(Deno.env.toObject());
    const stripeVars = allEnvVars.filter(key => key.includes('STRIPE'));
    const supabaseVars = allEnvVars.filter(key => key.includes('SUPABASE'));
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    console.log("[TEST-STRIPE-KEY] Environment analysis:", {
      totalVars: allEnvVars.length,
      stripeVars: stripeVars,
      supabaseVars: supabaseVars,
      stripeKeyExists: !!stripeKey,
      stripeKeyLength: stripeKey?.length || 0,
      stripeKeyType: stripeKey?.startsWith('sk_test_') ? 'test' : stripeKey?.startsWith('sk_live_') ? 'live' : 'unknown'
    });

    const result = {
      timestamp: new Date().toISOString(),
      environment: {
        total_vars: allEnvVars.length,
        stripe_vars: stripeVars,
        supabase_vars: supabaseVars
      },
      stripe_key: {
        exists: !!stripeKey,
        length: stripeKey?.length || 0,
        type: stripeKey?.startsWith('sk_test_') ? 'test' : stripeKey?.startsWith('sk_live_') ? 'live' : 'unknown',
        first_chars: stripeKey ? stripeKey.substring(0, 7) + '...' : 'none'
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[TEST-STRIPE-KEY] Error:", errorMessage);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});