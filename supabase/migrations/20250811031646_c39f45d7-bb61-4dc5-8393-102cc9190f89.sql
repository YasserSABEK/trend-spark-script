-- Fix security warnings by setting proper search paths for functions
CREATE OR REPLACE FUNCTION public.spend_credits(
  user_id_param UUID,
  amount_param INTEGER,
  reason_param TEXT,
  ref_type_param TEXT DEFAULT NULL,
  ref_id_param TEXT DEFAULT NULL,
  idempotency_key_param TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance INTEGER;
  existing_entry RECORD;
  result JSONB;
BEGIN
  -- Set transaction isolation level to prevent race conditions
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  
  -- Check for existing idempotency key if provided
  IF idempotency_key_param IS NOT NULL THEN
    SELECT * INTO existing_entry 
    FROM public.credit_ledger 
    WHERE user_id = user_id_param 
      AND metadata->>'idempotency_key' = idempotency_key_param;
    
    IF FOUND THEN
      -- Return previous result
      SELECT balance INTO current_balance FROM public.credit_balances WHERE user_id = user_id_param;
      RETURN jsonb_build_object('ok', true, 'new_balance', current_balance, 'duplicate', true);
    END IF;
  END IF;
  
  -- Lock and get current balance
  SELECT balance INTO current_balance 
  FROM public.credit_balances 
  WHERE user_id = user_id_param 
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF current_balance < amount_param THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_CREDITS', 'current_balance', current_balance);
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
  
  RETURN jsonb_build_object('ok', true, 'new_balance', current_balance - amount_param);
END;
$$;

-- Fix grant_monthly_credits function
CREATE OR REPLACE FUNCTION public.grant_monthly_credits()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sub_record RECORD;
  plan_credits INTEGER;
BEGIN
  FOR sub_record IN 
    SELECT us.user_id, us.plan_slug, bp.monthly_credits
    FROM public.user_subscriptions us
    JOIN public.billing_plans bp ON us.plan_slug = bp.slug
    WHERE us.status = 'active' 
      AND us.current_period_end < now()
  LOOP
    -- Grant monthly credits
    INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, ref_id)
    VALUES (sub_record.user_id, sub_record.monthly_credits, 'monthly_grant', 'subscription', sub_record.plan_slug);
    
    -- Update balance
    INSERT INTO public.credit_balances (user_id, balance, last_reset)
    VALUES (sub_record.user_id, sub_record.monthly_credits, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      balance = credit_balances.balance + sub_record.monthly_credits,
      last_reset = now(),
      updated_at = now();
      
    -- Update subscription period
    UPDATE public.user_subscriptions
    SET current_period_start = current_period_end,
        current_period_end = current_period_end + INTERVAL '1 month',
        updated_at = now()
    WHERE user_id = sub_record.user_id;
  END LOOP;
END;
$$;