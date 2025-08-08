-- Transitional RLS policies to allow viewing legacy rows without user_id

CREATE POLICY "View legacy Instagram reels (no user)"
ON public.instagram_reels
FOR SELECT
TO authenticated
USING (user_id IS NULL);

CREATE POLICY "View legacy TikTok videos (no user)"
ON public.tiktok_videos
FOR SELECT
TO authenticated
USING (user_id IS NULL);