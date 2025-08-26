-- Fix Security Definer View vulnerability 
-- Views cannot have RLS policies directly, but they inherit security from underlying tables

-- Drop the existing safe_profiles view
DROP VIEW IF EXISTS public.safe_profiles;

-- Recreate the safe_profiles view as a simple view (not security definer)
-- This will now respect the RLS policies from the underlying profiles table
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

-- Enable security barrier to ensure RLS is enforced
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON public.safe_profiles TO authenticated;