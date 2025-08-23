-- Phase 1: Fix missing credits for existing paid subscribers
-- First, let's create a function to grant initial credits when subscription is activated
CREATE OR REPLACE FUNCTION public.grant_subscription_credits(user_id_param uuid, plan_slug_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  plan_credits integer;
  current_balance integer;
  result jsonb;
BEGIN
  -- Get monthly credits for the plan
  SELECT monthly_credits INTO plan_credits
  FROM public.billing_plans
  WHERE slug = plan_slug_param;
  
  IF plan_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid plan slug');
  END IF;
  
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.credit_balances
  WHERE user_id = user_id_param;
  
  -- Insert credit ledger entry
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, ref_id)
  VALUES (user_id_param, plan_credits, 'subscription_activation', 'subscription', plan_slug_param);
  
  -- Update or insert credit balance
  INSERT INTO public.credit_balances (user_id, balance, last_reset)
  VALUES (user_id_param, plan_credits, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = credit_balances.balance + plan_credits,
    last_reset = now(),
    updated_at = now();
    
  RETURN jsonb_build_object('success', true, 'credits_granted', plan_credits);
END;
$$;

-- Phase 2: Create daily usage tracking for "credits used today"
CREATE TABLE IF NOT EXISTS public.daily_credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  credits_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on daily_credit_usage
ALTER TABLE public.daily_credit_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_credit_usage
CREATE POLICY "Users can view their own daily usage" ON public.daily_credit_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all daily usage" ON public.daily_credit_usage
FOR ALL
USING (auth.role() = 'service_role');

-- Create function to track daily credit usage
CREATE OR REPLACE FUNCTION public.track_daily_credit_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only track negative deltas (credits spent)
  IF NEW.delta < 0 THEN
    INSERT INTO public.daily_credit_usage (user_id, date, credits_used)
    VALUES (NEW.user_id, CURRENT_DATE, ABS(NEW.delta))
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
      credits_used = daily_credit_usage.credits_used + ABS(NEW.delta),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically track daily usage
DROP TRIGGER IF EXISTS track_credit_usage_daily ON public.credit_ledger;
CREATE TRIGGER track_credit_usage_daily
  AFTER INSERT ON public.credit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.track_daily_credit_usage();

-- Phase 3: Enhanced spend_credits function with better error handling
CREATE OR REPLACE FUNCTION public.spend_credits(
  user_id_param uuid, 
  amount_param integer, 
  reason_param text, 
  ref_type_param text DEFAULT NULL::text, 
  ref_id_param text DEFAULT NULL::text, 
  idempotency_key_param text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_balance INTEGER;
  existing_entry RECORD;
  result JSONB;
BEGIN
  -- Validate input
  IF amount_param <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT', 'message', 'Amount must be positive');
  END IF;
  
  -- Check for existing idempotency key if provided
  IF idempotency_key_param IS NOT NULL THEN
    SELECT * INTO existing_entry 
    FROM public.credit_ledger 
    WHERE user_id = user_id_param 
      AND metadata->>'idempotency_key' = idempotency_key_param;
    
    IF FOUND THEN
      SELECT balance INTO current_balance FROM public.credit_balances WHERE user_id = user_id_param;
      RETURN jsonb_build_object('ok', true, 'new_balance', current_balance, 'duplicate', true);
    END IF;
  END IF;
  
  -- Lock and get current balance
  SELECT balance INTO current_balance 
  FROM public.credit_balances 
  WHERE user_id = user_id_param 
  FOR UPDATE;
  
  -- If no balance record exists, create one with 0 balance
  IF current_balance IS NULL THEN
    INSERT INTO public.credit_balances (user_id, balance, last_reset)
    VALUES (user_id_param, 0, now());
    current_balance := 0;
  END IF;
  
  -- Check if user has enough credits
  IF current_balance < amount_param THEN
    RETURN jsonb_build_object(
      'ok', false, 
      'error', 'INSUFFICIENT_CREDITS', 
      'current_balance', current_balance,
      'required', amount_param,
      'message', format('Insufficient credits. You have %s but need %s.', current_balance, amount_param)
    );
  END IF;
  
  -- Insert ledger entry
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, ref_id, metadata)
  VALUES (
    user_id_param, 
    -amount_param, 
    reason_param, 
    ref_type_param, 
    ref_id_param,
    CASE WHEN idempotency_key_param IS NOT NULL 
         THEN jsonb_build_object('idempotency_key', idempotency_key_param)
         ELSE NULL END
  );
  
  -- Update balance
  UPDATE public.credit_balances 
  SET balance = balance - amount_param, updated_at = now()
  WHERE user_id = user_id_param;
  
  RETURN jsonb_build_object(
    'ok', true, 
    'new_balance', current_balance - amount_param,
    'amount_spent', amount_param,
    'reason', reason_param
  );
END;
$$;