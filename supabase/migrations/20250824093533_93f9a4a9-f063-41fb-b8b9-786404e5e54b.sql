-- Create RPC function for submitting user feedback to handle the TypeScript types issue
CREATE OR REPLACE FUNCTION public.submit_user_feedback(
  feedback_type_param TEXT,
  subject_param TEXT DEFAULT NULL,
  message_param TEXT
) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_feedback (user_id, feedback_type, subject, message, status)
  VALUES (auth.uid(), feedback_type_param, subject_param, message_param, 'new');
END;
$$;