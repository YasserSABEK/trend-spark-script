-- Fix remaining Security Definer View issues and secure SECURITY DEFINER functions
-- Add SET search_path = public to all SECURITY DEFINER functions for security

-- Update all SECURITY DEFINER functions to include proper search_path
CREATE OR REPLACE FUNCTION public.submit_user_feedback(feedback_type_param text, message_param text, subject_param text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_feedback (user_id, feedback_type, subject, message, status)
  VALUES (auth.uid(), feedback_type_param, subject_param, message_param, 'new');
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(action_type_param text, resource_type_param text, resource_id_param text DEFAULT NULL::text, metadata_param jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, 
    action_type, 
    resource_type, 
    resource_id, 
    metadata
  )
  VALUES (
    auth.uid(),
    action_type_param,
    resource_type_param,
    resource_id_param,
    metadata_param
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_credit_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Only log significant credit transactions (spending > 5 credits)
  IF NEW.delta < -5 THEN
    PERFORM public.log_security_event(
      'credit_spend',
      'credit_ledger',
      NEW.id::text,
      jsonb_build_object(
        'amount', ABS(NEW.delta),
        'reason', NEW.reason,
        'ref_type', NEW.ref_type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    JOIN public.billing_plans bp ON us.plan_slug = bp.slug
    WHERE us.user_id = auth.uid()
      AND bp.slug = 'agency'
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_owns_financial_data(target_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT target_user_id = auth.uid() OR public.is_admin_user();
$function$;

CREATE OR REPLACE FUNCTION public.track_daily_credit_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Only track negative deltas (credits spent)
  IF NEW.delta < 0 THEN
    INSERT INTO public.daily_credit_usage (user_id, date, credits_used)
    VALUES (NEW.user_id, CURRENT_DATE, ABS(NEW.delta))
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
      credits_used = daily_credit_usage.credits_used + ABS(NEW.delta),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_content_creation_rate_limit(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Check if user has created more than 10 content items in the last hour
  SELECT COUNT(*) INTO recent_count
  FROM public.content_items
  WHERE user_id = user_id_param
    AND created_at > now() - INTERVAL '1 hour';
  
  -- Log potential abuse
  IF recent_count > 10 THEN
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      'content_creation',
      user_id_param::text,
      jsonb_build_object(
        'recent_count', recent_count,
        'time_window', '1 hour'
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.monitor_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Log any attempts to modify user roles or sensitive data
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'privilege_escalation_attempt',
      TG_TABLE_NAME,
      NEW.id::text,
      jsonb_build_object(
        'old_values', to_jsonb(OLD),
        'new_values', to_jsonb(NEW),
        'user_id', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_owns_content(content_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT content_user_id = auth.uid()
$function$;

CREATE OR REPLACE FUNCTION public.check_profile_limit(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current profile count
  SELECT COUNT(*) INTO current_count
  FROM public.creator_profiles
  WHERE user_id = user_id_param;
  
  -- Get max profiles allowed for user's plan
  SELECT bp.max_profiles INTO max_allowed
  FROM public.user_subscriptions us
  JOIN public.billing_plans bp ON us.plan_slug = bp.slug
  WHERE us.user_id = user_id_param;
  
  -- If max_allowed is -1 (unlimited) or current count is less than max, allow
  RETURN (max_allowed = -1 OR current_count < max_allowed);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_analysis_by_id(analysis_id_param uuid)
 RETURNS TABLE(id uuid, content_item_id uuid, user_id uuid, status text, video_duration numeric, video_url text, transcript text, analysis_result jsonb, hook_text text, sections jsonb, insights jsonb, credits_used integer, deeper_analysis boolean, error_message text, created_at timestamp with time zone, updated_at timestamp with time zone, completed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.content_item_id,
    ca.user_id,
    ca.status,
    ca.video_duration,
    ca.video_url,
    ca.transcript,
    ca.analysis_result,
    ca.hook_text,
    ca.sections,
    ca.insights,
    ca.credits_used,
    ca.deeper_analysis,
    ca.error_message,
    ca.created_at,
    ca.updated_at,
    ca.completed_at
  FROM public.content_analysis ca
  WHERE ca.id = analysis_id_param
    AND ca.user_id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_credits(user_id_param uuid, credits_to_add integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET current_credits = current_credits + credits_to_add
  WHERE user_id = user_id_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_credits(user_id_param uuid)
 RETURNS TABLE(current_credits integer, monthly_limit integer, credits_used integer, subscription_plan text, billing_cycle_start date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.current_credits,
    p.monthly_credit_limit,
    p.credits_used_this_month,
    p.subscription_plan,
    p.billing_cycle_start
  FROM public.profiles p
  WHERE p.user_id = user_id_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.spend_credits(user_id_param uuid, amount_param integer, reason_param text, ref_type_param text DEFAULT NULL::text, ref_id_param text DEFAULT NULL::text, idempotency_key_param text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

CREATE OR REPLACE FUNCTION public.deduct_credits(user_id_param uuid, credits_to_deduct integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_credits_count integer;
  monthly_limit integer;
  credits_used integer;
  cycle_start date;
BEGIN
  -- Get current credit info
  SELECT current_credits, monthly_credit_limit, credits_used_this_month, billing_cycle_start
  INTO current_credits_count, monthly_limit, credits_used, cycle_start
  FROM public.profiles
  WHERE user_id = user_id_param;

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
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_monthly_credit_usage(user_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  monthly_usage integer;
BEGIN
  -- Sum all negative deltas (credits spent) for the current month
  SELECT COALESCE(SUM(ABS(delta)), 0) INTO monthly_usage
  FROM public.credit_ledger
  WHERE user_id = user_id_param
    AND delta < 0
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
  
  RETURN monthly_usage;
END;
$function$;

CREATE OR REPLACE FUNCTION public.grant_subscription_credits(user_id_param uuid, plan_slug_param text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

CREATE OR REPLACE FUNCTION public.grant_monthly_credits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  sub_record RECORD;
  plan_credits INTEGER;
BEGIN
  FOR sub_record IN 
    SELECT us.user_id, us.plan_slug, bp.monthly_credits
    FROM public.user_subscriptions us
    JOIN public.billing_plans bp ON us.plan_slug = bp.slug
    WHERE us.status = 'active' 
      AND us.current_period_end < now()
  LOOP
    -- Grant monthly credits
    INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, ref_id)
    VALUES (sub_record.user_id, sub_record.monthly_credits, 'monthly_grant', 'subscription', sub_record.plan_slug);
    
    -- Update balance
    INSERT INTO public.credit_balances (user_id, balance, last_reset)
    VALUES (sub_record.user_id, sub_record.monthly_credits, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      balance = credit_balances.balance + sub_record.monthly_credits,
      last_reset = now(),
      updated_at = now();
      
    -- Update subscription period
    UPDATE public.user_subscriptions
    SET current_period_start = current_period_end,
        current_period_end = current_period_end + INTERVAL '1 month',
        updated_at = now()
    WHERE user_id = sub_record.user_id;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Create default subscription (free plan)
  INSERT INTO public.user_subscriptions (user_id, plan_slug, status, created_at, updated_at)
  VALUES (NEW.id, 'free', 'trial', now(), now());
  
  -- Grant signup bonus (reduced from 10 to 5)
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, created_at)
  VALUES (NEW.id, 5, 'signup_bonus', 'system', now());
  
  -- Initialize credit balance (reduced from 10 to 5)
  INSERT INTO public.credit_balances (user_id, balance, last_reset, created_at, updated_at)
  VALUES (NEW.id, 5, now(), now(), now());
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.safe_deduct_credits(user_id_param uuid, credits_to_deduct integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

CREATE OR REPLACE FUNCTION public.get_content_analysis(content_item_id_param uuid)
 RETURNS TABLE(id uuid, content_item_id uuid, user_id uuid, status text, video_duration numeric, video_url text, transcript text, analysis_result jsonb, hook_text text, sections jsonb, insights jsonb, credits_used integer, deeper_analysis boolean, error_message text, created_at timestamp with time zone, updated_at timestamp with time zone, completed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.content_item_id,
    ca.user_id,
    ca.status,
    ca.video_duration,
    ca.video_url,
    ca.transcript,
    ca.analysis_result,
    ca.hook_text,
    ca.sections,
    ca.insights,
    ca.credits_used,
    ca.deeper_analysis,
    ca.error_message,
    ca.created_at,
    ca.updated_at,
    ca.completed_at
  FROM public.content_analysis ca
  WHERE ca.content_item_id = content_item_id_param
    AND ca.user_id = auth.uid()
  ORDER BY ca.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_subscription_plan(user_id_param uuid, plan_name text, credit_limit integer, stripe_customer_id_param text DEFAULT NULL::text, stripe_subscription_id_param text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET subscription_plan = plan_name,
      monthly_credit_limit = credit_limit,
      current_credits = credit_limit,
      credits_used_this_month = 0,
      billing_cycle_start = DATE_TRUNC('month', CURRENT_DATE),
      stripe_customer_id = COALESCE(stripe_customer_id_param, stripe_customer_id),
      stripe_subscription_id = COALESCE(stripe_subscription_id_param, stripe_subscription_id)
  WHERE user_id = user_id_param;
END;
$function$;