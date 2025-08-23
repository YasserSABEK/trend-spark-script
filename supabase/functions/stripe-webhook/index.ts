import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    }

    // Use service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id, customerId: session.customer });
        
        // Get customer email
        const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
        const customerEmail = customer.email;
        
        if (!customerEmail) {
          logStep("No customer email found");
          break;
        }

        // Find user by email
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserByEmail(customerEmail);
        if (authError || !authUser?.user) {
          logStep("User not found for email", { email: customerEmail, error: authError });
          break;
        }

        const userId = authUser.user.id;
        const planSlug = session.metadata?.plan_slug || 'creator';
        
        logStep("Found user for checkout", { userId, email: customerEmail, planSlug });

        // Grant subscription credits immediately
        const { data: creditResult, error: creditError } = await supabaseClient.rpc('grant_subscription_credits', {
          user_id_param: userId,
          plan_slug_param: planSlug
        });

        if (creditError) {
          logStep("Error granting credits", { error: creditError });
        } else {
          logStep("Credits granted successfully", creditResult);
        }

        // Update subscription status
        await supabaseClient.from('user_subscriptions').upsert({
          user_id: userId,
          plan_slug: planSlug,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        logStep("Subscription updated for checkout completion");
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_succeeded", { invoiceId: invoice.id, customerId: invoice.customer });
        
        // Skip if this is the first invoice (handled by checkout.session.completed)
        if (invoice.billing_reason === 'subscription_create') {
          logStep("Skipping first invoice - handled by checkout");
          break;
        }

        // Get customer email
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        const customerEmail = customer.email;
        
        if (!customerEmail) {
          logStep("No customer email found for invoice");
          break;
        }

        // Find user by email
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserByEmail(customerEmail);
        if (authError || !authUser?.user) {
          logStep("User not found for invoice", { email: customerEmail });
          break;
        }

        const userId = authUser.user.id;
        
        // Get subscription to determine plan
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        let planSlug = 'starter';
        if (amount <= 1999) planSlug = "starter";
        else if (amount <= 4999) planSlug = "pro";
        else planSlug = "agency";

        logStep("Determined plan for renewal", { planSlug, amount });

        // Grant monthly credits for renewal
        const { data: creditResult, error: creditError } = await supabaseClient.rpc('grant_subscription_credits', {
          user_id_param: userId,
          plan_slug_param: planSlug
        });

        if (creditError) {
          logStep("Error granting renewal credits", { error: creditError });
        } else {
          logStep("Renewal credits granted successfully", creditResult);
        }

        // Update subscription period
        await supabaseClient.from('user_subscriptions').upsert({
          user_id: userId,
          plan_slug: planSlug,
          status: 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        logStep("Subscription updated for renewal");
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing customer.subscription.deleted", { subscriptionId: subscription.id, customerId: subscription.customer });
        
        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const customerEmail = customer.email;
        
        if (!customerEmail) {
          logStep("No customer email found for cancelled subscription");
          break;
        }

        // Find user by email
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserByEmail(customerEmail);
        if (authError || !authUser?.user) {
          logStep("User not found for cancellation", { email: customerEmail });
          break;
        }

        const userId = authUser.user.id;

        // Downgrade to free plan
        await supabaseClient.from('user_subscriptions').upsert({
          user_id: userId,
          plan_slug: 'free',
          status: 'cancelled',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        logStep("Subscription downgraded to free plan");
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_failed", { invoiceId: invoice.id, customerId: invoice.customer });
        
        // Get customer email
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        const customerEmail = customer.email;
        
        if (!customerEmail) {
          logStep("No customer email found for failed payment");
          break;
        }

        // Find user by email
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserByEmail(customerEmail);
        if (authError || !authUser?.user) {
          logStep("User not found for failed payment", { email: customerEmail });
          break;
        }

        const userId = authUser.user.id;

        // Mark subscription as past_due
        await supabaseClient.from('user_subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);

        logStep("Subscription marked as past_due");
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});