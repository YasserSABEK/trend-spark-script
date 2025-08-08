-- Create TikTok oEmbed cache table
CREATE TABLE public.tiktok_oembed_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL UNIQUE,
  url text NOT NULL,
  html text,
  thumbnail_url text,
  width int,
  height int,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tiktok_oembed_cache ENABLE ROW LEVEL SECURITY;

-- Public read-only policy (cached data is safe to read)
CREATE POLICY "public_read_oembed_cache"
ON public.tiktok_oembed_cache
FOR SELECT
USING (true);

-- Indexes for performance
CREATE INDEX idx_tiktok_oembed_cache_url ON public.tiktok_oembed_cache (url);
CREATE INDEX idx_tiktok_oembed_cache_fetched_at ON public.tiktok_oembed_cache (fetched_at);

-- Constraint to ensure video_id is numeric
ALTER TABLE public.tiktok_oembed_cache 
ADD CONSTRAINT check_video_id_numeric 
CHECK (video_id ~ '^[0-9]+$');