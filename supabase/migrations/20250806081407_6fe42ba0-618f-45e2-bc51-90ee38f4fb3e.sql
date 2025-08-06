-- Add DELETE policy for search_queue table to allow users to delete their searches
CREATE POLICY "Users can delete their own searches" 
ON public.search_queue 
FOR DELETE 
USING ((auth.uid() = user_id) OR (user_id IS NULL));

-- Add profile_photo_url column to search_queue for caching Instagram profile photos
ALTER TABLE public.search_queue 
ADD COLUMN profile_photo_url TEXT;