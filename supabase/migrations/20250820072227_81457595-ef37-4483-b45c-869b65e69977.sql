-- Add missing fields to creator_profiles table for better multi-profile support
ALTER TABLE public.creator_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add a constraint to limit videos per profile (will be enforced in app logic)
-- The user_content_samples table already tracks this relationship

-- Update any existing profiles to have completed status if they have data
UPDATE public.creator_profiles 
SET profile_status = 'complete' 
WHERE profile_status = 'draft' 
AND brand_name IS NOT NULL 
AND niche IS NOT NULL 
AND target_audience IS NOT NULL;