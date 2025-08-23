-- Fix credit tracking system

-- 1. Attach the trigger to credit_ledger table
DROP TRIGGER IF EXISTS track_daily_credit_usage_trigger ON public.credit_ledger;
CREATE TRIGGER track_daily_credit_usage_trigger
  AFTER INSERT ON public.credit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.track_daily_credit_usage();

-- 2. Create function to calculate monthly credit usage
CREATE OR REPLACE FUNCTION public.get_monthly_credit_usage(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  monthly_usage integer;
BEGIN
  -- Sum all negative deltas (credits spent) for the current month
  SELECT COALESCE(SUM(ABS(delta)), 0) INTO monthly_usage
  FROM public.credit_ledger
  WHERE user_id = user_id_param
    AND delta < 0
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
  
  RETURN monthly_usage;
END;
$function$;