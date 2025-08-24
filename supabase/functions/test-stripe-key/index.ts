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
    console.log("[TEST-STRIPE-KEY] Testing secret access");
    
    // Test all environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const allEnvVars = Object.entries(Deno.env.toObject());
    const secretKeys = allEnvVars.filter(([key]) => key.includes('STRIPE'));
    
    console.log("[TEST-STRIPE-KEY] All STRIPE-related env vars:", secretKeys.map(([key, value]) => [key, value ? `${value.substring(0, 7)}...` : 'null']));
    
    const result = {
      timestamp: new Date().toISOString(),
      hasStripeKey: !!stripeKey,
      stripeKeyType: stripeKey ? (stripeKey.startsWith('sk_test_') ? 'test' : stripeKey.startsWith('sk_live_') ? 'live' : 'unknown') : 'none',
      stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 12) : 'none',
      stripeKeyLength: stripeKey?.length || 0,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseAnonKey: !!supabaseAnonKey,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      totalEnvVars: allEnvVars.length,
      stripeEnvVars: secretKeys.length
    };
    
    console.log("[TEST-STRIPE-KEY] Secret access test result:", result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[TEST-STRIPE-KEY] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});