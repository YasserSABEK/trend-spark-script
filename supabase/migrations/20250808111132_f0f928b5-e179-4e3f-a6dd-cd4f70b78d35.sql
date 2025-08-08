-- Fix the function search path issue for existing functions
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
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