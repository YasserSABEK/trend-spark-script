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
    console.log("[TEST-STRIPE-KEY] === DETAILED ENVIRONMENT ANALYSIS ===");
    
    // Get all environment variables and categorize them
    const allEnvVars = Deno.env.toObject();
    const allKeys = Object.keys(allEnvVars);
    
    // Categorize environment variables
    const stripeVars = allKeys.filter(key => key.toLowerCase().includes('stripe'));
    const supabaseVars = allKeys.filter(key => key.toLowerCase().includes('supabase'));
    const functionsVars = allKeys.filter(key => key.toLowerCase().includes('function'));
    
    console.log("[TEST-STRIPE-KEY] Environment overview:", {
      totalVars: allKeys.length,
      stripeVars: stripeVars,
      supabaseVars: supabaseVars,
      functionsVars: functionsVars,
      allVarNames: allKeys.sort()
    });
    
    // Try multiple methods to get the Stripe key
    const methods = {
      direct: Deno.env.get("STRIPE_SECRET_KEY"),
      upperCase: Deno.env.get("STRIPE_SECRET_KEY"),
      lowerCase: Deno.env.get("stripe_secret_key"),
      withSpaces: Deno.env.get(" STRIPE_SECRET_KEY "),
      fromObject: allEnvVars["STRIPE_SECRET_KEY"],
      fromObjectLower: allEnvVars["stripe_secret_key"]
    };
    
    console.log("[TEST-STRIPE-KEY] Stripe key access methods:", {
      direct: { exists: !!methods.direct, length: methods.direct?.length || 0 },
      upperCase: { exists: !!methods.upperCase, length: methods.upperCase?.length || 0 },
      lowerCase: { exists: !!methods.lowerCase, length: methods.lowerCase?.length || 0 },
      withSpaces: { exists: !!methods.withSpaces, length: methods.withSpaces?.length || 0 },
      fromObject: { exists: !!methods.fromObject, length: methods.fromObject?.length || 0 },
      fromObjectLower: { exists: !!methods.fromObjectLower, length: methods.fromObjectLower?.length || 0 }
    });
    
    // Check if any method worked
    const workingMethod = Object.entries(methods).find(([key, value]) => value && value.length > 0);
    
    console.log("[TEST-STRIPE-KEY] Working method:", workingMethod ? workingMethod[0] : "NONE");
    
    // Environment context analysis
    const envContext = {
      denoVersion: Deno.version,
      permissions: {
        env: await Deno.permissions.query({ name: "env" }),
        net: await Deno.permissions.query({ name: "net" })
      },
      cwd: Deno.cwd(),
      args: Deno.args
    };
    
    console.log("[TEST-STRIPE-KEY] Runtime context:", envContext);
    
    const result = {
      timestamp: new Date().toISOString(),
      success: !!workingMethod,
      environment: {
        total_vars: allKeys.length,
        stripe_vars: stripeVars,
        supabase_vars: supabaseVars,
        functions_vars: functionsVars
      },
      access_methods: Object.fromEntries(
        Object.entries(methods).map(([key, value]) => [
          key, 
          {
            exists: !!value,
            length: value?.length || 0,
            type: value?.startsWith('sk_test_') ? 'test' : value?.startsWith('sk_live_') ? 'live' : 'unknown',
            prefix: value ? value.substring(0, 7) + '...' : 'none'
          }
        ])
      ),
      working_method: workingMethod ? workingMethod[0] : null,
      runtime_context: envContext
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[TEST-STRIPE-KEY] CRITICAL ERROR:", errorMessage);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});