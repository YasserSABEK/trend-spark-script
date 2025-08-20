-- Creator profiles table
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  brand_name TEXT NOT NULL,
  niche TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  content_goals TEXT[],
  on_camera BOOLEAN DEFAULT false,
  content_format TEXT, -- 'educational', 'entertainment', 'motivational'
  personality_traits TEXT[],
  instagram_handle TEXT,
  profile_status TEXT DEFAULT 'draft', -- 'draft', 'complete'
  sample_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for creator_profiles
CREATE POLICY "Users can view their own creator profile" 
ON public.creator_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own creator profile" 
ON public.creator_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creator profile" 
ON public.creator_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own creator profile" 
ON public.creator_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enhanced content samples tracking
CREATE TABLE public.user_content_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.creator_profiles NOT NULL,
  content_item_id UUID REFERENCES public.content_items NOT NULL,
  analysis_id UUID REFERENCES public.content_analysis NOT NULL,
  is_style_reference BOOLEAN DEFAULT false,
  style_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_content_samples ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_content_samples
CREATE POLICY "Users can view their own content samples" 
ON public.user_content_samples 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content samples" 
ON public.user_content_samples 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content samples" 
ON public.user_content_samples 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content samples" 
ON public.user_content_samples 
FOR DELETE 
USING (auth.uid() = user_id);

-- AI-generated style profiles
CREATE TABLE public.user_style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.creator_profiles NOT NULL,
  style_traits JSONB NOT NULL, -- AI-extracted patterns
  summary_text TEXT NOT NULL, -- Human-readable summary
  sample_count INTEGER NOT NULL,
  confidence_score NUMERIC DEFAULT 0.0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_style_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_style_profiles
CREATE POLICY "Users can view their own style profiles" 
ON public.user_style_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own style profiles" 
ON public.user_style_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own style profiles" 
ON public.user_style_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own style profiles" 
ON public.user_style_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add columns to existing generated_scripts table
ALTER TABLE public.generated_scripts 
ADD COLUMN profile_id UUID REFERENCES public.creator_profiles,
ADD COLUMN style_profile_id UUID REFERENCES public.user_style_profiles,
ADD COLUMN generation_goal TEXT,
ADD COLUMN platform_optimized TEXT DEFAULT 'reel',
ADD COLUMN conditioning_data JSONB,
ADD COLUMN quality_score NUMERIC DEFAULT 0.0;

-- Create trigger for updating timestamps
CREATE TRIGGER update_creator_profiles_updated_at
BEFORE UPDATE ON public.creator_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_style_profiles_updated_at
BEFORE UPDATE ON public.user_style_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();