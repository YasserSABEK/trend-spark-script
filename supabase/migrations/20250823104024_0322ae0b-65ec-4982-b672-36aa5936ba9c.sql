-- Add user tracking to TikTok oEmbed cache
ALTER TABLE public.tiktok_oembed_cache 
ADD COLUMN requested_by_user_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX idx_tiktok_oembed_cache_user_id ON public.tiktok_oembed_cache(requested_by_user_id);

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "authenticated_read_oembed_cache" ON public.tiktok_oembed_cache;

-- Create user-specific RLS policies
CREATE POLICY "Users can view their own cached TikTok embeds" 
ON public.tiktok_oembed_cache 
FOR SELECT 
USING (auth.uid() = requested_by_user_id);

-- Allow public access to legacy entries (entries without a user_id)
CREATE POLICY "Public access to legacy TikTok cache entries" 
ON public.tiktok_oembed_cache 
FOR SELECT 
USING (requested_by_user_id IS NULL);

-- Service role can manage all cache entries for maintenance
CREATE POLICY "Service role can manage TikTok cache" 
ON public.tiktok_oembed_cache 
FOR ALL 
USING (auth.role() = 'service_role');

-- Allow authenticated users to insert their own cache entries
CREATE POLICY "Users can create their own TikTok cache entries" 
ON public.tiktok_oembed_cache 
FOR INSERT 
WITH CHECK (auth.uid() = requested_by_user_id);