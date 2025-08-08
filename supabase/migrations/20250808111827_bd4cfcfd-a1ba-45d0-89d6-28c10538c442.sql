-- Transitional RLS policies to allow viewing legacy rows without user_id
-- These policies are TEMPORARY to avoid breaking existing data visibility.
-- They allow authenticated users to view rows where user_id IS NULL.

CREATE POLICY IF NOT EXISTS "View legacy Instagram reels (no user)"
ON public.instagram_reels
FOR SELECT
TO authenticated
USING (user_id IS NULL);

CREATE POLICY IF NOT EXISTS "View legacy TikTok videos (no user)"
ON public.tiktok_videos
FOR SELECT
TO authenticated
USING (user_id IS NULL);