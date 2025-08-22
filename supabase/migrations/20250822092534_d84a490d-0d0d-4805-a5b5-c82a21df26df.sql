-- Add new fields to content_items table for content planning
ALTER TABLE public.content_items 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS planned_publish_date TIMESTAMP WITH TIME ZONE;

-- Update existing content_items to have titles based on captions or default
UPDATE public.content_items 
SET title = COALESCE(
  CASE 
    WHEN caption IS NOT NULL AND LENGTH(caption) > 0 
    THEN SUBSTRING(caption FROM 1 FOR 50) || CASE WHEN LENGTH(caption) > 50 THEN '...' ELSE '' END
    ELSE 'Untitled Content'
  END
)
WHERE title IS NULL;

-- Standardize status values to the 5 required statuses
UPDATE public.content_items 
SET status = CASE 
  WHEN status = 'saved' THEN 'idea'
  WHEN status = 'processing' THEN 'scripting'
  WHEN status = 'ready' THEN 'ready'
  WHEN status = 'completed' THEN 'posted'
  WHEN status = 'archived' THEN 'archived'
  ELSE 'idea'
END
WHERE status NOT IN ('idea', 'scripting', 'ready', 'posted', 'archived');

-- Create index for better performance on status-based queries
CREATE INDEX IF NOT EXISTS idx_content_items_status ON public.content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_user_status ON public.content_items(user_id, status);