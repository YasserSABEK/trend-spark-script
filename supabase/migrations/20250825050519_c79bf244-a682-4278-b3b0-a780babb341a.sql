-- Fix security linter issues from previous migration

-- Fix SECURITY DEFINER view by making it a regular view
DROP VIEW IF EXISTS public.safe_profiles;
CREATE VIEW public.safe_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  username,
  bio,
  avatar_url,
  instagram_username,
  subscription_plan,
  subscription_status,
  current_credits,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.safe_profiles TO authenticated;

-- Fix Function Search Path Mutable warnings by setting search_path
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    JOIN public.billing_plans bp ON us.plan_slug = bp.slug
    WHERE us.user_id = auth.uid()
      AND bp.slug = 'agency'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_financial_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT target_user_id = auth.uid() OR public.is_admin_user();
$$;

CREATE OR REPLACE FUNCTION public.check_content_creation_rate_limit(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.monitor_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;