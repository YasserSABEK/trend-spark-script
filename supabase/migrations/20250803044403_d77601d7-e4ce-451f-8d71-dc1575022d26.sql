-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  instagram_username TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create Apify runs table
CREATE TABLE public.apify_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id TEXT UNIQUE NOT NULL,
  actor_id TEXT,
  status TEXT CHECK (status IN ('READY', 'RUNNING', 'SUCCEEDED', 'FAILED', 'ABORTED')),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  dataset_id TEXT,
  input_data JSONB,
  items_count INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0.0000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for apify_runs
ALTER TABLE public.apify_runs ENABLE ROW LEVEL SECURITY;

-- Apify runs policies
CREATE POLICY "Users can view their own runs" 
ON public.apify_runs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own runs" 
ON public.apify_runs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs" 
ON public.apify_runs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create Instagram reels table
CREATE TABLE public.instagram_reels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  shortcode TEXT,
  caption TEXT,
  hashtags TEXT[],
  mentions TEXT[],
  username TEXT,
  display_name TEXT,
  followers INTEGER,
  verified BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  video_view_count BIGINT DEFAULT 0,
  video_play_count BIGINT DEFAULT 0,
  viral_score INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  timestamp TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  apify_run_id TEXT REFERENCES public.apify_runs(run_id),
  dataset_id TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for instagram_reels (public read access for viral content)
ALTER TABLE public.instagram_reels ENABLE ROW LEVEL SECURITY;

-- Instagram reels policies (public access for discovering viral content)
CREATE POLICY "Anyone can view Instagram reels" 
ON public.instagram_reels 
FOR SELECT 
USING (true);

-- Create generated scripts table
CREATE TABLE public.generated_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reel_id UUID REFERENCES public.instagram_reels(id),
  title TEXT NOT NULL,
  hook TEXT NOT NULL,
  main_content TEXT NOT NULL,
  call_to_action TEXT NOT NULL,
  suggested_hashtags TEXT[],
  niche TEXT,
  target_audience TEXT,
  tone_of_voice TEXT,
  brand_voice TEXT,
  hook_style TEXT,
  format_type TEXT DEFAULT 'reel' CHECK (format_type IN ('reel', 'story')),
  optimal_posting_time TEXT,
  performance_score INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for generated_scripts
ALTER TABLE public.generated_scripts ENABLE ROW LEVEL SECURITY;

-- Generated scripts policies
CREATE POLICY "Users can view their own scripts" 
ON public.generated_scripts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scripts" 
ON public.generated_scripts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts" 
ON public.generated_scripts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts" 
ON public.generated_scripts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create analytics table
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value INTEGER DEFAULT 0,
  metadata JSONB,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for analytics
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics policies
CREATE POLICY "Users can view their own analytics" 
ON public.user_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics" 
ON public.user_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_scripts_updated_at
BEFORE UPDATE ON public.generated_scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();