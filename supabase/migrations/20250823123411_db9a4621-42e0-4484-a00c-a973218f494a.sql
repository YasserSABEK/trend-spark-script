-- Update credit allocations for Starter and Pro plans
UPDATE public.billing_plans 
SET monthly_credits = 50 
WHERE slug = 'starter';

UPDATE public.billing_plans 
SET monthly_credits = 200 
WHERE slug = 'pro';