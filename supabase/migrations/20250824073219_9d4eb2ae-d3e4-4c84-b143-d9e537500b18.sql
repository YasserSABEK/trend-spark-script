-- Create user_preferences table for storing user settings
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Theme and UI preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  date_format TEXT DEFAULT 'MM/dd/yyyy',
  
  -- Notification preferences
  email_notifications JSONB DEFAULT '{
    "script_completion": true,
    "credit_warnings": true,
    "weekly_digest": true,
    "feature_announcements": true,
    "billing_reminders": true
  }',
  in_app_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  
  -- Content and Analysis preferences
  default_analysis_depth TEXT DEFAULT 'standard' CHECK (default_analysis_depth IN ('quick', 'standard', 'deep')),
  preferred_platforms TEXT[] DEFAULT ARRAY['tiktok', 'instagram'],
  auto_save_scripts BOOLEAN DEFAULT true,
  
  -- Privacy preferences
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private')),
  data_sharing BOOLEAN DEFAULT false,
  
  -- Workspace preferences
  dashboard_layout TEXT DEFAULT 'default',
  sidebar_collapsed BOOLEAN DEFAULT false,
  
  -- Credit and billing preferences
  credit_alerts JSONB DEFAULT '{
    "low_balance_threshold": 10,
    "weekly_usage_summary": true
  }',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" 
ON public.user_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();