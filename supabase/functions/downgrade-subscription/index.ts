import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DOWNGRADE-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Price mapping for different plans
const PLAN_PRICES = {
  starter: 1900, // $19 in cents
  pro: 4900,     // $49 in cents
  agency: 9900   // $99 in cents
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { targetPlan } = await req.json();
    if (!targetPlan || !PLAN_PRICES[targetPlan as keyof typeof PLAN_PRICES]) {
      throw new Error("Invalid target plan specified");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use service role for database operations
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find the customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found to downgrade");
    }

    const subscription = subscriptions.data[0];
    logStep("Found active subscription", { subscriptionId: subscription.id });

    // Create new price for the target plan
    const newPrice = await stripe.prices.create({
      currency: "usd",
      unit_amount: PLAN_PRICES[targetPlan as keyof typeof PLAN_PRICES],
      recurring: { interval: "month" },
      product_data: {
        name: `${targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)} Plan`,
      },
    });

    logStep("Created new price", { priceId: newPrice.id, targetPlan });

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPrice.id,
        },
      ],
      proration_behavior: "create_prorations",
    });

    logStep("Subscription updated", { 
      subscriptionId: updatedSubscription.id,
      newPriceId: newPrice.id 
    });

    // Update local database
    await supabaseClient
      .from("user_subscriptions")
      .update({
        plan_slug: targetPlan,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    logStep("Updated subscription in database", { planSlug: targetPlan });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Successfully downgraded to ${targetPlan} plan`,
      new_plan: targetPlan
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in downgrade-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});