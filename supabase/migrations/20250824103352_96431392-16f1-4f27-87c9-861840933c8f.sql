-- Fix function search path security issue
-- Update existing functions to set immutable search_path

-- Fix log_credit_transaction function
CREATE OR REPLACE FUNCTION public.log_credit_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log significant credit transactions (spending > 5 credits)
  IF NEW.delta < -5 THEN
    PERFORM public.log_security_event(
      'credit_spend',
      'credit_ledger',
      NEW.id::text,
      jsonb_build_object(
        'amount', ABS(NEW.delta),
        'reason', NEW.reason,
        'ref_type', NEW.ref_type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public';

-- Add the trigger to actually log credit transactions
DROP TRIGGER IF EXISTS log_credit_transactions_trigger ON public.credit_ledger;
CREATE TRIGGER log_credit_transactions_trigger
  AFTER INSERT ON public.credit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.log_credit_transaction();

-- Update existing database functions to fix search path issues
CREATE OR REPLACE FUNCTION public.track_daily_credit_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;