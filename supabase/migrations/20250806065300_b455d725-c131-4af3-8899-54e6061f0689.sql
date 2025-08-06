-- Update instagram_reels table to support search queues and reel-specific data
ALTER TABLE public.instagram_reels 
ADD COLUMN IF NOT EXISTS search_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS search_status TEXT DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS search_username TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'clips',
ADD COLUMN IF NOT EXISTS video_duration DECIMAL,
ADD COLUMN IF NOT EXISTS is_video BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS search_requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS processing_time_seconds INTEGER DEFAULT 0;

-- Create search_queue table to track scraping operations
CREATE TABLE IF NOT EXISTS public.search_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_results INTEGER DEFAULT 0,
  processing_time_seconds INTEGER DEFAULT 0,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS on search_queue
ALTER TABLE public.search_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for search_queue
CREATE POLICY "Users can view their own searches" 
ON public.search_queue 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create searches" 
ON public.search_queue 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own searches" 
ON public.search_queue 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Update existing records to mark as video content if they have video data
UPDATE public.instagram_reels 
SET is_video = true, product_type = 'clips'
WHERE video_url IS NOT NULL OR video_view_count > 0;