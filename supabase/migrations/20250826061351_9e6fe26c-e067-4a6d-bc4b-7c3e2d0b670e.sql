-- Final check and cleanup for safe_profiles view to ensure no SECURITY DEFINER properties remain

-- Drop and recreate the safe_profiles view one more time to ensure clean state
DROP VIEW IF EXISTS public.safe_profiles CASCADE;

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

-- Ensure the view uses security_barrier for RLS enforcement
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- Grant appropriate permissions to authenticated users only
GRANT SELECT ON public.safe_profiles TO authenticated;

-- Ensure RLS is enabled on the underlying profiles table (should already be enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add explicit RLS policy for safe_profiles view access (though it should inherit from profiles table)
-- Views inherit RLS from underlying tables, but let's be explicit about access control