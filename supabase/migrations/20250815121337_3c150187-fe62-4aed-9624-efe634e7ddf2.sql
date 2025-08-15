-- Fix the spend_credits function by removing the problematic SET TRANSACTION ISOLATION LEVEL
CREATE OR REPLACE FUNCTION public.spend_credits(user_id_param uuid, amount_param integer, reason_param text, ref_type_param text DEFAULT NULL::text, ref_id_param text DEFAULT NULL::text, idempotency_key_param text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_balance INTEGER;
  existing_entry RECORD;
  result JSONB;
BEGIN
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
  
  -- Lock and get current balance (FOR UPDATE provides sufficient concurrency control)
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
$function$