-- Phase 1: Critical Data Protection - Secure Financial Data Access

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    JOIN public.billing_plans bp ON us.plan_slug = bp.slug
    WHERE us.user_id = auth.uid()
      AND bp.slug = 'agency'
  );
$$;

-- Create a security definer function to check if user owns the financial data
CREATE OR REPLACE FUNCTION public.user_owns_financial_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT target_user_id = auth.uid() OR public.is_admin_user();
$$;

-- Add restricted access policy for sensitive profile fields
CREATE POLICY "Restrict access to financial profile data"
ON public.profiles
FOR SELECT
USING (
  CASE 
    WHEN public.user_owns_financial_data(user_id) THEN true
    ELSE false
  END
);

-- Create a secure view for profile data that excludes sensitive fields
CREATE OR REPLACE VIEW public.safe_profiles AS
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

-- Grant access to the safe view
GRANT SELECT ON public.safe_profiles TO authenticated;

-- Add enhanced security for credit_topups table
CREATE POLICY "Enhanced credit topups security"
ON public.credit_topups
FOR SELECT
USING (
  auth.uid() = user_id OR public.is_admin_user()
);

-- Restrict provider_ref and pricing data access in credit_topups
CREATE POLICY "Restrict payment provider data"
ON public.credit_topups
FOR UPDATE
USING (
  public.is_admin_user()
);

-- Add comprehensive audit logging for financial data access
CREATE OR REPLACE FUNCTION public.log_financial_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log access to sensitive financial data
  IF TG_OP = 'SELECT' THEN
    PERFORM public.log_security_event(
      'financial_data_access',
      'profile_financial_data',
      NEW.user_id::text,
      jsonb_build_object(
        'accessed_fields', TG_ARGV[0],
        'table_name', TG_TABLE_NAME
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit logging trigger for profiles table
CREATE TRIGGER audit_profile_financial_access
  AFTER SELECT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_financial_data_access('stripe_customer_id,stripe_subscription_id,current_credits');

-- Add enhanced security for user_preferences to prevent data harvesting
CREATE POLICY "Strict user preferences access"
ON public.user_preferences
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Add rate limiting function for content creation
CREATE OR REPLACE FUNCTION public.check_content_creation_rate_limit(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add rate limiting policy for content creation
CREATE POLICY "Rate limit content creation"
ON public.content_items
FOR INSERT
WITH CHECK (
  public.check_content_creation_rate_limit(auth.uid())
);

-- Add enhanced analytics data protection
CREATE POLICY "Strict analytics data access"
ON public.user_analytics
FOR SELECT
USING (
  auth.uid() = user_id OR public.is_admin_user()
);

-- Add monitoring for privilege escalation attempts
CREATE OR REPLACE FUNCTION public.monitor_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add triggers for monitoring sensitive table updates
CREATE TRIGGER monitor_user_subscription_changes
  AFTER UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_privilege_escalation();

CREATE TRIGGER monitor_credit_balance_changes
  AFTER UPDATE ON public.credit_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_privilege_escalation();