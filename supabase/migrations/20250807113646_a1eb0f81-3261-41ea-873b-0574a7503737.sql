-- Add search_type and hashtag fields to search_queue table
ALTER TABLE public.search_queue 
ADD COLUMN search_type TEXT DEFAULT 'username' CHECK (search_type IN ('username', 'hashtag')),
ADD COLUMN hashtag TEXT;

-- Add search_hashtag field to instagram_reels table
ALTER TABLE public.instagram_reels 
ADD COLUMN search_hashtag TEXT;

-- Create indexes for efficient hashtag queries
CREATE INDEX idx_search_queue_hashtag ON public.search_queue(hashtag) WHERE search_type = 'hashtag';
CREATE INDEX idx_instagram_reels_hashtag ON public.instagram_reels(search_hashtag) WHERE search_hashtag IS NOT NULL;