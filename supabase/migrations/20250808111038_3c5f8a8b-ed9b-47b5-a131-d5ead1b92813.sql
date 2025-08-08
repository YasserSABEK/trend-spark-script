-- Phase 1: Fix Critical Data Privacy Issues

-- First, let's add user_id to tables that don't have proper user association
ALTER TABLE public.instagram_reels ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.tiktok_videos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_instagram_reels_user_id ON public.instagram_reels(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_videos_user_id ON public.tiktok_videos(user_id);

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view Instagram reels" ON public.instagram_reels;
DROP POLICY IF EXISTS "Allow inserting Instagram reels from scraping" ON public.instagram_reels;
DROP POLICY IF EXISTS "Allow updating Instagram reels" ON public.instagram_reels;

DROP POLICY IF EXISTS "Anyone can view TikTok videos" ON public.tiktok_videos;
DROP POLICY IF EXISTS "Allow inserting TikTok videos from scraping" ON public.tiktok_videos;
DROP POLICY IF EXISTS "Allow updating TikTok videos" ON public.tiktok_videos;

-- Create secure RLS policies for Instagram reels
CREATE POLICY "Users can view their own scraped Instagram reels"
ON public.instagram_reels
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Instagram reels"
ON public.instagram_reels
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Instagram reels"
ON public.instagram_reels
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create secure RLS policies for TikTok videos
CREATE POLICY "Users can view their own scraped TikTok videos"
ON public.tiktok_videos
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TikTok videos"
ON public.tiktok_videos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TikTok videos"
ON public.tiktok_videos
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create a function to safely deduct credits with proper validation
CREATE OR REPLACE FUNCTION public.safe_deduct_credits(user_id_param uuid, credits_to_deduct integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_credits_count integer;
  monthly_limit integer;
  credits_used integer;
  cycle_start date;
  result jsonb;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT current_credits, monthly_credit_limit, credits_used_this_month, billing_cycle_start
  INTO current_credits_count, monthly_limit, credits_used, cycle_start
  FROM public.profiles
  WHERE user_id = user_id_param
  FOR UPDATE;

  -- Check if billing cycle needs reset (monthly reset)
  IF cycle_start < DATE_TRUNC('month', CURRENT_DATE) THEN
    -- Reset monthly usage
    UPDATE public.profiles
    SET credits_used_this_month = 0,
        current_credits = monthly_credit_limit,
        billing_cycle_start = DATE_TRUNC('month', CURRENT_DATE)
    WHERE user_id = user_id_param;
    
    current_credits_count := monthly_limit;
    credits_used := 0;
  END IF;

  -- Check if user has enough credits
  IF current_credits_count >= credits_to_deduct THEN
    -- Deduct credits
    UPDATE public.profiles
    SET current_credits = current_credits - credits_to_deduct,
        credits_used_this_month = credits_used_this_month + credits_to_deduct
    WHERE user_id = user_id_param;
    
    result := jsonb_build_object(
      'success', true,
      'remaining_credits', current_credits_count - credits_to_deduct,
      'message', 'Credits deducted successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'remaining_credits', current_credits_count,
      'message', 'Insufficient credits'
    );
  END IF;

  RETURN result;
END;
$function$;

-- Create function to validate user ownership of scraped content
CREATE OR REPLACE FUNCTION public.user_owns_content(content_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT content_user_id = auth.uid()
$$;