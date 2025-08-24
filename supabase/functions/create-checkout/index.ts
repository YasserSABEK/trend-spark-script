import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Function to get Stripe key using multiple methods
const getStripeKey = () => {
  const methods = [
    () => Deno.env.get("STRIPE_SECRET_KEY"),
    () => Deno.env.toObject()["STRIPE_SECRET_KEY"],
    () => Deno.env.get("stripe_secret_key"),
    () => Deno.env.toObject()["stripe_secret_key"]
  ];
  
  for (let i = 0; i < methods.length; i++) {
    try {
      const key = methods[i]();
      if (key && key.length > 0) {
        logStep(`Stripe key found using method ${i + 1}`, { length: key.length, type: key.startsWith('sk_') ? 'valid' : 'invalid' });
        return key;
      }
    } catch (error) {
      logStep(`Method ${i + 1} failed`, { error: error.message });
    }
  }
  
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("=== FUNCTION STARTED ===");
    logStep("Request method", { method: req.method });
    
    // Environment check
    const allEnvVars = Object.keys(Deno.env.toObject());
    const stripeVars = allEnvVars.filter(key => key.toLowerCase().includes('stripe'));
    logStep("Environment check", { 
      totalVars: allEnvVars.length, 
      stripeVars: stripeVars,
      hasStripeKey: allEnvVars.includes('STRIPE_SECRET_KEY')
    });
    
    // Get Stripe key using multiple methods
    const stripeKey = getStripeKey();
    if (!stripeKey) {
      logStep("CRITICAL: No Stripe key found", { availableVars: stripeVars });
      throw new Error("STRIPE_SECRET_KEY not accessible through any method");
    }
    
    logStep("Stripe key obtained successfully", { 
      length: stripeKey.length,
      type: stripeKey.startsWith('sk_test_') ? 'test' : stripeKey.startsWith('sk_live_') ? 'live' : 'unknown',
      prefix: stripeKey.substring(0, 7)
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    logStep("Supabase client initialized");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { planSlug } = await req.json();
    if (!planSlug) {
      throw new Error("Plan slug is required");
    }
    
    logStep("Plan requested", { planSlug });

    // Get plan details from billing_plans table
    const { data: planData, error: planError } = await supabaseClient
      .from('billing_plans')
      .select('*')
      .eq('slug', planSlug)
      .single();

    if (planError || !planData) {
      logStep("Plan not found", { planSlug, error: planError });
      throw new Error(`Invalid plan: ${planSlug}`);
    }
    
    logStep("Plan found", { plan: planData.name, price: planData.price_usd, credits: planData.monthly_credits });

    // Initialize Stripe
    logStep("Initializing Stripe client");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    logStep("Checking for existing customer");
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Create checkout session
    logStep("Creating checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `${planData.name} Plan`,
              description: `${planData.monthly_credits} credits per month`
            },
            unit_amount: Math.round(planData.price_usd * 100),
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/billing?canceled=true&plan=${planSlug}`,
      metadata: {
        plan_slug: planSlug,
        user_id: user.id,
      },
    });

    logStep("Checkout session created successfully", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR occurred", { message: errorMessage, stack: error instanceof Error ? error.stack : 'No stack' });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});