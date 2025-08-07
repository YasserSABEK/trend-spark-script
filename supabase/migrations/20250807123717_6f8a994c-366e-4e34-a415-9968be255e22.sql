-- Update credits for user with email yassersabek@yahoo.com
UPDATE public.profiles 
SET 
  current_credits = 999999,
  monthly_credit_limit = 999999,
  credits_used_this_month = 0,
  billing_cycle_start = CURRENT_DATE
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'yassersabek@yahoo.com'
);