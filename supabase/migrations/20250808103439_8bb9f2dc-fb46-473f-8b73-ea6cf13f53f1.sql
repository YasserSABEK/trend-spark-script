-- Fix critical security vulnerabilities in search_queue table
-- Step 1: Delete rows with NULL user_id (orphaned searches that pose security risk)
DELETE FROM public.search_queue WHERE user_id IS NULL;

-- Step 2: Make user_id NOT NULL to prevent future orphaned searches
ALTER TABLE public.search_queue 
  ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Drop existing RLS policies that allow NULL user_id
DROP POLICY IF EXISTS "Users can create searches" ON public.search_queue;
DROP POLICY IF EXISTS "Users can view their own searches" ON public.search_queue;
DROP POLICY IF EXISTS "Users can update their own searches" ON public.search_queue;
DROP POLICY IF EXISTS "Users can delete their own searches" ON public.search_queue;

-- Step 4: Create secure RLS policies without NULL user_id loopholes
CREATE POLICY "Users can view only their searches"
ON public.search_queue
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches"
ON public.search_queue
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches"
ON public.search_queue
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches"
ON public.search_queue
FOR DELETE
USING (auth.uid() = user_id);