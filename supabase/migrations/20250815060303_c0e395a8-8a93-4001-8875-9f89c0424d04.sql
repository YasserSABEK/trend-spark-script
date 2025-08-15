-- Phase 1: Fix Database Integrity Issues

-- First, create missing credit_balances records for users who don't have them
INSERT INTO public.credit_balances (user_id, balance, last_reset, created_at, updated_at)
SELECT 
    p.user_id,
    COALESCE(p.current_credits, 0) as balance,
    COALESCE(p.billing_cycle_start::timestamp with time zone, now()) as last_reset,
    now() as created_at,
    now() as updated_at
FROM public.profiles p
LEFT JOIN public.credit_balances cb ON p.user_id = cb.user_id
WHERE cb.user_id IS NULL;

-- Create missing user_subscriptions records for users who don't have them
INSERT INTO public.user_subscriptions (user_id, plan_slug, status, created_at, updated_at)
SELECT 
    p.user_id,
    COALESCE(p.subscription_plan, 'free') as plan_slug,
    'trial' as status,
    now() as created_at,
    now() as updated_at
FROM public.profiles p
LEFT JOIN public.user_subscriptions us ON p.user_id = us.user_id
WHERE us.user_id IS NULL;

-- Fix the handle_new_user trigger to work properly
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
  
  -- Grant signup bonus
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, created_at)
  VALUES (NEW.id, 10, 'signup_bonus', 'system', now());
  
  -- Initialize credit balance
  INSERT INTO public.credit_balances (user_id, balance, last_reset, created_at, updated_at)
  VALUES (NEW.id, 10, now(), now(), now());
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update billing plans to have proper default records
INSERT INTO public.billing_plans (slug, name, price_usd, monthly_credits, is_default, created_at)
VALUES 
    ('free', 'Free', 0, 0, true, now()),
    ('creator', 'Creator', 19, 75, false, now()),
    ('pro', 'Pro', 39, 200, false, now()),
    ('team', 'Team', 94, 700, false, now())
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    price_usd = EXCLUDED.price_usd,
    monthly_credits = EXCLUDED.monthly_credits,
    is_default = EXCLUDED.is_default;