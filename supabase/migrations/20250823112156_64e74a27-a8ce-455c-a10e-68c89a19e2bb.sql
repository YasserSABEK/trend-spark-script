-- Update spend_credits function to handle unlimited credits for agency plan
CREATE OR REPLACE FUNCTION public.spend_credits(user_id_param uuid, amount_param integer, reason_param text, ref_type_param text DEFAULT NULL::text, ref_id_param text DEFAULT NULL::text, idempotency_key_param text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_balance INTEGER;
  existing_entry RECORD;
  result JSONB;
  user_plan_slug TEXT;
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
  
  -- Get user's plan to check for unlimited credits
  SELECT bp.slug INTO user_plan_slug
  FROM public.user_subscriptions us
  JOIN public.billing_plans bp ON us.plan_slug = bp.slug
  WHERE us.user_id = user_id_param;
  
  -- If user has agency plan with unlimited credits, always allow
  IF user_plan_slug = 'agency' THEN
    -- Insert ledger entry for tracking
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
    
    RETURN jsonb_build_object(
      'ok', true, 
      'new_balance', 999999, -- Return high number for unlimited
      'amount_spent', amount_param,
      'reason', reason_param,
      'unlimited', true
    );
  END IF;
  
  -- Lock and get current balance for non-agency users
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