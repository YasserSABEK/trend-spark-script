-- Create content_items table with secure RLS and triggers (idempotent)

-- 1) Create table
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_post_id TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  status TEXT NOT NULL DEFAULT 'saved',
  scheduled_at TIMESTAMPTZ,
  notes TEXT,
  color TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  script_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Enable RLS
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- 3) RLS policies (drop if exist then recreate)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'content_items'
      AND p.policyname = 'Users can view their own content items'
  ) THEN
    DROP POLICY "Users can view their own content items" ON public.content_items;
  END IF;
END $$;
CREATE POLICY "Users can view their own content items"
ON public.content_items
FOR SELECT
USING (auth.uid() = user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'content_items'
      AND p.policyname = 'Users can insert their own content items'
  ) THEN
    DROP POLICY "Users can insert their own content items" ON public.content_items;
  END IF;
END $$;
CREATE POLICY "Users can insert their own content items"
ON public.content_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'content_items'
      AND p.policyname = 'Users can update their own content items'
  ) THEN
    DROP POLICY "Users can update their own content items" ON public.content_items;
  END IF;
END $$;
CREATE POLICY "Users can update their own content items"
ON public.content_items
FOR UPDATE
USING (auth.uid() = user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'content_items'
      AND p.policyname = 'Users can delete their own content items'
  ) THEN
    DROP POLICY "Users can delete their own content items" ON public.content_items;
  END IF;
END $$;
CREATE POLICY "Users can delete their own content items"
ON public.content_items
FOR DELETE
USING (auth.uid() = user_id);

-- 4) Timestamp trigger function (secure)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5) Trigger for content_items
DROP TRIGGER IF EXISTS trg_update_content_items_updated_at ON public.content_items;
CREATE TRIGGER trg_update_content_items_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_content_items_user ON public.content_items (user_id);
CREATE INDEX IF NOT EXISTS idx_content_items_user_status ON public.content_items (user_id, status);
CREATE INDEX IF NOT EXISTS idx_content_items_scheduled_at ON public.content_items (scheduled_at);
