-- Clean up failed TikTok hashtag searches and reset them for retry
UPDATE search_queue 
SET 
  status = 'failed', 
  error_message = 'Fixed edge function error - please retry search',
  completed_at = now()
WHERE status = 'pending' 
  AND platform = 'tiktok' 
  AND search_type = 'hashtag';