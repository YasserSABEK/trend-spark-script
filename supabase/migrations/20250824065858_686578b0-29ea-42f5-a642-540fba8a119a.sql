-- Remove public access to legacy TikTok cache entries for security
DROP POLICY IF EXISTS "Public access to legacy TikTok cache entries" ON public.tiktok_oembed_cache;