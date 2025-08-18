-- Add content_type column to instagram_reels table to distinguish between videos and images
ALTER TABLE public.instagram_reels 
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'video';