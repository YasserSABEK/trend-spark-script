-- First, temporarily disable the foreign key constraint
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_plan_slug_fkey;

-- Create new billing plans with the updated structure
INSERT INTO public.billing_plans (slug, name, monthly_credits, price_usd, max_profiles, has_advanced_analytics, is_default) 
VALUES 
  ('starter', 'Starter', 100, 19.00, -1, false, false),
  ('agency', 'Agency', -1, 99.00, -1, true, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_credits = EXCLUDED.monthly_credits,
  price_usd = EXCLUDED.price_usd,
  max_profiles = EXCLUDED.max_profiles,
  has_advanced_analytics = EXCLUDED.has_advanced_analytics;

-- Add new columns if they don't exist
ALTER TABLE public.billing_plans 
ADD COLUMN IF NOT EXISTS max_profiles INTEGER DEFAULT -1,
ADD COLUMN IF NOT EXISTS has_advanced_analytics BOOLEAN DEFAULT false;

-- Update existing plans
UPDATE public.billing_plans SET 
  monthly_credits = 5,
  max_profiles = 1,
  has_advanced_analytics = false
WHERE slug = 'free';

UPDATE public.billing_plans SET 
  monthly_credits = 500,
  price_usd = 49.00,
  max_profiles = -1,
  has_advanced_analytics = true
WHERE slug = 'pro';

-- Update user subscriptions to use new plan slugs
UPDATE public.user_subscriptions 
SET plan_slug = 'starter' 
WHERE plan_slug = 'creator';

UPDATE public.user_subscriptions 
SET plan_slug = 'agency' 
WHERE plan_slug = 'team';

-- Delete old plan entries
DELETE FROM public.billing_plans WHERE slug IN ('creator', 'team');

-- Re-add the foreign key constraint
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_plan_slug_fkey 
FOREIGN KEY (plan_slug) REFERENCES public.billing_plans(slug);