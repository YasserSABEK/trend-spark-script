-- Fix billing plans to ensure they have the correct slugs and are properly set up
-- The issue appears to be that the plans exist but the query might have issues

-- Let's make sure all plans are properly set up
UPDATE billing_plans SET slug = 'free' WHERE name = 'Free';
UPDATE billing_plans SET slug = 'starter' WHERE name = 'Starter'; 
UPDATE billing_plans SET slug = 'pro' WHERE name = 'Pro';
UPDATE billing_plans SET slug = 'agency' WHERE name = 'Agency';

-- Ensure we have the basic plans that the frontend expects
INSERT INTO billing_plans (name, slug, price_usd, monthly_credits, max_profiles, has_advanced_analytics, is_default)
VALUES 
  ('Free', 'free', 0.00, 5, 1, false, true),
  ('Starter', 'starter', 19.00, 50, -1, false, false),
  ('Pro', 'pro', 49.00, 200, -1, true, false),
  ('Agency', 'agency', 99.00, -1, -1, true, false)
ON CONFLICT (slug) 
DO UPDATE SET 
  name = EXCLUDED.name,
  price_usd = EXCLUDED.price_usd,
  monthly_credits = EXCLUDED.monthly_credits,
  max_profiles = EXCLUDED.max_profiles,
  has_advanced_analytics = EXCLUDED.has_advanced_analytics,
  is_default = EXCLUDED.is_default;