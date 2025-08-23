-- Update billing plans to match new pricing structure
-- First, update existing plans with new pricing and credits

-- Update Free plan (keep existing but change credits from 0 to 5)
UPDATE public.billing_plans 
SET monthly_credits = 5, 
    name = 'Free'
WHERE slug = 'free';

-- Update Creator plan to Starter plan 
UPDATE public.billing_plans 
SET name = 'Starter', 
    slug = 'starter',
    monthly_credits = 100,
    price_usd = 19.00
WHERE slug = 'creator';

-- Update Pro plan with new pricing
UPDATE public.billing_plans 
SET monthly_credits = 500,
    price_usd = 49.00
WHERE slug = 'pro';

-- Update Team plan to Agency plan
UPDATE public.billing_plans 
SET name = 'Agency',
    slug = 'agency', 
    monthly_credits = -1, -- Use -1 to represent unlimited
    price_usd = 99.00
WHERE slug = 'team';

-- Add new columns for plan features and limits
ALTER TABLE public.billing_plans 
ADD COLUMN IF NOT EXISTS max_profiles INTEGER DEFAULT -1, -- -1 means unlimited
ADD COLUMN IF NOT EXISTS has_advanced_analytics BOOLEAN DEFAULT false;

-- Set feature flags for each plan
UPDATE public.billing_plans SET 
  max_profiles = 1, 
  has_advanced_analytics = false 
WHERE slug = 'free';

UPDATE public.billing_plans SET 
  max_profiles = -1, 
  has_advanced_analytics = false 
WHERE slug = 'starter';

UPDATE public.billing_plans SET 
  max_profiles = -1, 
  has_advanced_analytics = true 
WHERE slug = 'pro';

UPDATE public.billing_plans SET 
  max_profiles = -1, 
  has_advanced_analytics = true 
WHERE slug = 'agency';

-- Update existing user subscriptions to use new plan slugs
UPDATE public.user_subscriptions 
SET plan_slug = 'starter' 
WHERE plan_slug = 'creator';

UPDATE public.user_subscriptions 
SET plan_slug = 'agency' 
WHERE plan_slug = 'team';

-- Update default credit amount for new users from 10 to 5 in handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Create function to check profile limits
CREATE OR REPLACE FUNCTION public.check_profile_limit(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Add RLS policy to enforce profile limits
CREATE POLICY "profile_limit_check" ON public.creator_profiles
FOR INSERT
WITH CHECK (check_profile_limit(auth.uid()));

-- Add daily usage tracking for fair-use monitoring
CREATE TABLE IF NOT EXISTS public.agency_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  actions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on agency usage tracking
ALTER TABLE public.agency_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for agency usage tracking
CREATE POLICY "users_own_agency_usage" ON public.agency_usage_tracking
FOR ALL
USING (auth.uid() = user_id);

-- Create trigger to update agency usage tracking
CREATE OR REPLACE FUNCTION public.track_agency_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only track for agency users
  IF EXISTS (
    SELECT 1 FROM public.user_subscriptions us 
    JOIN public.billing_plans bp ON us.plan_slug = bp.slug
    WHERE us.user_id = NEW.user_id AND bp.slug = 'agency'
  ) THEN
    INSERT INTO public.agency_usage_tracking (user_id, date, credits_used, actions_count)
    VALUES (NEW.user_id, CURRENT_DATE, ABS(NEW.delta), 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
      credits_used = agency_usage_tracking.credits_used + ABS(NEW.delta),
      actions_count = agency_usage_tracking.actions_count + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on credit_ledger for agency usage tracking
DROP TRIGGER IF EXISTS track_agency_usage_trigger ON public.credit_ledger;
CREATE TRIGGER track_agency_usage_trigger
  AFTER INSERT ON public.credit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.track_agency_usage();