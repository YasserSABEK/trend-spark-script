import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FIX-CREDITS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting credit fix process");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Use service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const fixes = [];

    // Get all Stripe customers with active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100
    });

    logStep("Found active Stripe subscriptions", { count: subscriptions.data.length });

    for (const subscription of subscriptions.data) {
      try {
        // Get customer details
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const customerEmail = customer.email;
        
        if (!customerEmail) {
          logStep("No email for customer", { customerId: customer.id });
          continue;
        }

        logStep("Processing customer", { email: customerEmail, subscriptionId: subscription.id });

        // Find user in Supabase
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserByEmail(customerEmail);
        if (authError || !authUser?.user) {
          logStep("User not found in Supabase", { email: customerEmail });
          fixes.push({
            email: customerEmail,
            issue: "User not found in Supabase",
            action: "Manual user creation needed"
          });
          continue;
        }

        const userId = authUser.user.id;

        // Determine plan from subscription
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        let planSlug = 'creator';
        if (amount <= 1999) planSlug = "creator";
        else if (amount <= 3999) planSlug = "pro"; 
        else planSlug = "team";

        logStep("Determined plan", { email: customerEmail, planSlug, amount });

        // Check current subscription in Supabase
        const { data: currentSub } = await supabaseClient
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        // Update subscription
        await supabaseClient.from('user_subscriptions').upsert({
          user_id: userId,
          plan_slug: planSlug,
          status: 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        // Check current balance
        const { data: balanceData } = await supabaseClient
          .from('credit_balances')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();

        // Get plan credits
        const { data: planData } = await supabaseClient
          .from('billing_plans')
          .select('monthly_credits')
          .eq('slug', planSlug)
          .single();

        const expectedCredits = planData?.monthly_credits || 0;
        const currentBalance = balanceData?.balance || 0;

        // If user has significantly fewer credits than expected, grant them
        if (currentBalance < expectedCredits / 2) {
          logStep("Granting missing credits", { 
            email: customerEmail, 
            currentBalance, 
            expectedCredits,
            planSlug 
          });

          const { data: creditResult, error: creditError } = await supabaseClient.rpc('grant_subscription_credits', {
            user_id_param: userId,
            plan_slug_param: planSlug
          });

          if (creditError) {
            logStep("Error granting credits", { email: customerEmail, error: creditError });
            fixes.push({
              email: customerEmail,
              issue: "Failed to grant credits",
              error: creditError.message,
              action: "Manual credit grant needed"
            });
          } else {
            fixes.push({
              email: customerEmail,
              issue: "Missing credits",
              action: "Credits granted",
              details: creditResult
            });
          }
        } else {
          fixes.push({
            email: customerEmail,
            issue: "None - credits adequate",
            currentBalance,
            expectedCredits
          });
        }

      } catch (error) {
        logStep("Error processing subscription", { subscriptionId: subscription.id, error: error.message });
        fixes.push({
          subscriptionId: subscription.id,
          issue: "Processing error",
          error: error.message
        });
      }
    }

    logStep("Credit fix process completed", { totalProcessed: fixes.length });

    return new Response(JSON.stringify({ 
      success: true, 
      fixes,
      summary: {
        totalProcessed: fixes.length,
        creditsGranted: fixes.filter(f => f.action === "Credits granted").length,
        issuesFound: fixes.filter(f => f.issue !== "None - credits adequate").length
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in fix process", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});