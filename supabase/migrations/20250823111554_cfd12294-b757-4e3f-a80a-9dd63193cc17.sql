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