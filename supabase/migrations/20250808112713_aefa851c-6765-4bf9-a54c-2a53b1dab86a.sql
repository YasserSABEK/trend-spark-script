-- Add unique constraint to prevent duplicate TikTok videos per search hashtag
-- This will prevent the same video from being inserted multiple times for the same hashtag search
ALTER TABLE tiktok_videos 
ADD CONSTRAINT unique_video_per_hashtag 
UNIQUE (post_id, search_hashtag);

-- Clean up existing duplicates by keeping only the most recent entry for each duplicate
DELETE FROM tiktok_videos 
WHERE id NOT IN (
  SELECT DISTINCT ON (post_id, search_hashtag) id
  FROM tiktok_videos 
  ORDER BY post_id, search_hashtag, scraped_at DESC
);