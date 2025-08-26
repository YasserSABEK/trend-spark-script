-- Fix Security Definer View vulnerability by dropping and recreating safe_profiles view
-- and adding proper RLS policies to secure user data access

-- First, drop the existing safe_profiles view
DROP VIEW IF EXISTS public.safe_profiles;

-- Create the safe_profiles view WITHOUT SECURITY DEFINER
-- This view will now respect the RLS policies of the underlying profiles table
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

-- Enable RLS on the safe_profiles view
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- Add RLS policies to safe_profiles view to ensure users can only see their own data
CREATE POLICY "Users can view their own safe profile data" 
ON public.safe_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON public.safe_profiles TO authenticated;