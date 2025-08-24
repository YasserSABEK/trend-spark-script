-- CRITICAL SECURITY FIXES: Address data exposure vulnerabilities

-- Fix 1: Secure profiles table - restrict to authenticated users only for sensitive data
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- Fix 2: Secure credit_ledger table - ensure only authenticated users can access their own data  
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON public.credit_ledger;
CREATE POLICY "Users can view their own credit transactions" ON public.credit_ledger
FOR SELECT USING (auth.uid() = user_id);

-- Fix 3: Secure credit_topups table - restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view their own credit topups" ON public.credit_topups;
CREATE POLICY "Users can view their own credit topups" ON public.credit_topups
FOR SELECT USING (auth.uid() = user_id);

-- Fix 4: Secure functions with proper search_path to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.grant_subscription_credits(user_id_param uuid, plan_slug_param text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_credits integer;
  current_balance integer;
  result jsonb;
BEGIN
  -- Get monthly credits for the plan
  SELECT monthly_credits INTO plan_credits
  FROM public.billing_plans
  WHERE slug = plan_slug_param;
  
  IF plan_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid plan slug');
  END IF;
  
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.credit_balances
  WHERE user_id = user_id_param;
  
  -- Insert credit ledger entry
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, ref_id)
  VALUES (user_id_param, plan_credits, 'subscription_activation', 'subscription', plan_slug_param);
  
  -- Update or insert credit balance
  INSERT INTO public.credit_balances (user_id, balance, last_reset)
  VALUES (user_id_param, plan_credits, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = credit_balances.balance + plan_credits,
    last_reset = now(),
    updated_at = now();
    
  RETURN jsonb_build_object('success', true, 'credits_granted', plan_credits);
END;
$function$;

-- Fix 5: Update all other security definer functions with proper search_path
CREATE OR REPLACE FUNCTION public.safe_deduct_credits(user_id_param uuid, credits_to_deduct integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_credits_count integer;
  monthly_limit integer;
  credits_used integer;
  cycle_start date;
  result jsonb;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT current_credits, monthly_credit_limit, credits_used_this_month, billing_cycle_start
  INTO current_credits_count, monthly_limit, credits_used, cycle_start
  FROM public.profiles
  WHERE user_id = user_id_param
  FOR UPDATE;

  -- Check if billing cycle needs reset (monthly reset)
  IF cycle_start < DATE_TRUNC('month', CURRENT_DATE) THEN
    -- Reset monthly usage
    UPDATE public.profiles
    SET credits_used_this_month = 0,
        current_credits = monthly_credit_limit,
        billing_cycle_start = DATE_TRUNC('month', CURRENT_DATE)
    WHERE user_id = user_id_param;
    
    current_credits_count := monthly_limit;
    credits_used := 0;
  END IF;

  -- Check if user has enough credits
  IF current_credits_count >= credits_to_deduct THEN
    -- Deduct credits
    UPDATE public.profiles
    SET current_credits = current_credits - credits_to_deduct,
        credits_used_this_month = credits_used_this_month + credits_to_deduct
    WHERE user_id = user_id_param;
    
    result := jsonb_build_object(
      'success', true,
      'remaining_credits', current_credits_count - credits_to_deduct,
      'message', 'Credits deducted successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'remaining_credits', current_credits_count,
      'message', 'Insufficient credits'
    );
  END IF;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.spend_credits(user_id_param uuid, amount_param integer, reason_param text, ref_type_param text DEFAULT NULL::text, ref_id_param text DEFAULT NULL::text, idempotency_key_param text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_balance INTEGER;
  existing_entry RECORD;
  result JSONB;
  user_plan_slug TEXT;
BEGIN
  -- Validate input
  IF amount_param <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT', 'message', 'Amount must be positive');
  END IF;
  
  -- Check for existing idempotency key if provided
  IF idempotency_key_param IS NOT NULL THEN
    SELECT * INTO existing_entry 
    FROM public.credit_ledger 
    WHERE user_id = user_id_param 
      AND metadata->>'idempotency_key' = idempotency_key_param;
    
    IF FOUND THEN
      SELECT balance INTO current_balance FROM public.credit_balances WHERE user_id = user_id_param;
      RETURN jsonb_build_object('ok', true, 'new_balance', current_balance, 'duplicate', true);
    END IF;
  END IF;
  
  -- Get user's plan to check for unlimited credits
  SELECT bp.slug INTO user_plan_slug
  FROM public.user_subscriptions us
  JOIN public.billing_plans bp ON us.plan_slug = bp.slug
  WHERE us.user_id = user_id_param;
  
  -- If user has agency plan with unlimited credits, always allow
  IF user_plan_slug = 'agency' THEN
    -- Insert ledger entry for tracking
    INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, ref_id, metadata)
    VALUES (
      user_id_param, 
      -amount_param, 
      reason_param, 
      ref_type_param, 
      ref_id_param,
      CASE WHEN idempotency_key_param IS NOT NULL 
           THEN jsonb_build_object('idempotency_key', idempotency_key_param)
           ELSE NULL END
    );
    
    RETURN jsonb_build_object(
      'ok', true, 
      'new_balance', 999999, -- Return high number for unlimited
      'amount_spent', amount_param,
      'reason', reason_param,
      'unlimited', true
    );
  END IF;
  
  -- Lock and get current balance for non-agency users
  SELECT balance INTO current_balance 
  FROM public.credit_balances 
  WHERE user_id = user_id_param 
  FOR UPDATE;
  
  -- If no balance record exists, create one with 0 balance
  IF current_balance IS NULL THEN
    INSERT INTO public.credit_balances (user_id, balance, last_reset)
    VALUES (user_id_param, 0, now());
    current_balance := 0;
  END IF;
  
  -- Check if user has enough credits
  IF current_balance < amount_param THEN
    RETURN jsonb_build_object(
      'ok', false, 
      'error', 'INSUFFICIENT_CREDITS', 
      'current_balance', current_balance,
      'required', amount_param,
      'message', format('Insufficient credits. You have %s but need %s.', current_balance, amount_param)
    );
  END IF;
  
  -- Insert ledger entry
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, ref_id, metadata)
  VALUES (
    user_id_param, 
    -amount_param, 
    reason_param, 
    ref_type_param, 
    ref_id_param,
    CASE WHEN idempotency_key_param IS NOT NULL 
         THEN jsonb_build_object('idempotency_key', idempotency_key_param)
         ELSE NULL END
  );
  
  -- Update balance
  UPDATE public.credit_balances 
  SET balance = balance - amount_param, updated_at = now()
  WHERE user_id = user_id_param;
  
  RETURN jsonb_build_object(
    'ok', true, 
    'new_balance', current_balance - amount_param,
    'amount_spent', amount_param,
    'reason', reason_param
  );
END;
$function$;