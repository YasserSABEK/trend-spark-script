-- Add missing columns to generated_scripts table for viral script features
ALTER TABLE public.generated_scripts 
ADD COLUMN IF NOT EXISTS shots JSONB,
ADD COLUMN IF NOT EXISTS performance_metrics JSONB,
ADD COLUMN IF NOT EXISTS script_format TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS total_duration TEXT,
ADD COLUMN IF NOT EXISTS viral_tactics JSONB;