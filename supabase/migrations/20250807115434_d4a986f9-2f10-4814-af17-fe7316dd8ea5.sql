-- Fix search_queue table to allow nullable username for hashtag searches
ALTER TABLE public.search_queue ALTER COLUMN username DROP NOT NULL;

-- Update the constraint to allow either username OR hashtag to be present
ALTER TABLE public.search_queue ADD CONSTRAINT check_username_or_hashtag 
CHECK (
  (username IS NOT NULL AND hashtag IS NULL AND search_type = 'username') OR
  (hashtag IS NOT NULL AND username IS NULL AND search_type = 'hashtag')
);