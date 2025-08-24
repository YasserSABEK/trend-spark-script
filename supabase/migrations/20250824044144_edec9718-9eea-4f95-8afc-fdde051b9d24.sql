-- Fix remaining database functions with proper search_path
CREATE OR REPLACE FUNCTION public.track_daily_credit_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.user_owns_content(content_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT content_user_id = auth.uid()
$function$;

CREATE OR REPLACE FUNCTION public.get_content_analysis(content_item_id_param uuid)
 RETURNS TABLE(id uuid, content_item_id uuid, user_id uuid, status text, video_duration numeric, video_url text, transcript text, analysis_result jsonb, hook_text text, sections jsonb, insights jsonb, credits_used integer, deeper_analysis boolean, error_message text, created_at timestamp with time zone, updated_at timestamp with time zone, completed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.check_profile_limit(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.grant_monthly_credits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.add_credits(user_id_param uuid, credits_to_add integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET current_credits = current_credits + credits_to_add
  WHERE user_id = user_id_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.deduct_credits(user_id_param uuid, credits_to_deduct integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.update_subscription_plan(user_id_param uuid, plan_name text, credit_limit integer, stripe_customer_id_param text DEFAULT NULL::text, stripe_subscription_id_param text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_user_credits(user_id_param uuid)
 RETURNS TABLE(current_credits integer, monthly_limit integer, credits_used integer, subscription_plan text, billing_cycle_start date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_monthly_credit_usage(user_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;