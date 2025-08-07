-- Create tiktok_videos table with TikTok-specific fields
CREATE TABLE public.tiktok_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id text NOT NULL,
  url text NOT NULL,
  web_video_url text,
  shortcode text,
  caption text,
  hashtags text[],
  mentions text[],
  username text,
  display_name text,
  author_avatar text,
  verified boolean DEFAULT false,
  followers integer,
  
  -- TikTok engagement metrics
  digg_count integer DEFAULT 0, -- likes in TikTok
  share_count integer DEFAULT 0,
  play_count bigint DEFAULT 0,
  comment_count integer DEFAULT 0,
  collect_count integer DEFAULT 0,
  
  -- Video metadata
  video_duration numeric,
  is_video boolean DEFAULT true,
  thumbnail_url text,
  video_url text,
  
  -- Music metadata
  music_name text,
  music_author text,
  music_original boolean DEFAULT false,
  
  -- Calculated metrics
  viral_score integer DEFAULT 0,
  engagement_rate numeric DEFAULT 0.00,
  
  -- Timestamps
  timestamp timestamp with time zone,
  scraped_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Search metadata
  search_id uuid DEFAULT gen_random_uuid(),
  search_hashtag text,
  search_status text DEFAULT 'completed',
  search_requested_at timestamp with time zone DEFAULT now(),
  processing_time_seconds integer DEFAULT 0,
  
  -- Apify metadata
  apify_run_id text,
  dataset_id text,
  
  -- Platform identifier
  platform text DEFAULT 'tiktok'
);

-- Enable RLS
ALTER TABLE public.tiktok_videos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view TikTok videos" 
ON public.tiktok_videos 
FOR SELECT 
USING (true);

CREATE POLICY "Allow inserting TikTok videos from scraping" 
ON public.tiktok_videos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow updating TikTok videos" 
ON public.tiktok_videos 
FOR UPDATE 
USING (true);

-- Create indexes for efficient queries
CREATE INDEX idx_tiktok_videos_search_hashtag ON public.tiktok_videos(search_hashtag);
CREATE INDEX idx_tiktok_videos_viral_score ON public.tiktok_videos(viral_score DESC);
CREATE INDEX idx_tiktok_videos_timestamp ON public.tiktok_videos(timestamp DESC);
CREATE INDEX idx_tiktok_videos_platform ON public.tiktok_videos(platform);
CREATE INDEX idx_tiktok_videos_search_status ON public.tiktok_videos(search_status);

-- Update search_queue to support TikTok
ALTER TABLE public.search_queue 
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'tiktok';