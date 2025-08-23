-- First, update the user_subscriptions to use new plan slugs before updating billing_plans
UPDATE public.user_subscriptions 
SET plan_slug = 'starter' 
WHERE plan_slug = 'creator';

UPDATE public.user_subscriptions 
SET plan_slug = 'agency' 
WHERE plan_slug = 'team';

-- Now update billing plans to match new pricing structure
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