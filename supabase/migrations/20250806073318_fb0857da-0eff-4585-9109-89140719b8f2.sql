-- Add INSERT policy for instagram_reels table to allow saving scraped reels
CREATE POLICY "Allow inserting Instagram reels from scraping" 
ON public.instagram_reels 
FOR INSERT 
WITH CHECK (true);

-- Add UPDATE policy for instagram_reels table  
CREATE POLICY "Allow updating Instagram reels" 
ON public.instagram_reels 
FOR UPDATE 
USING (true);