-- Secure billing_plans table - restrict to authenticated users only
DROP POLICY IF EXISTS "billing_plans_public_read" ON public.billing_plans;

-- Create new policy to allow only authenticated users to view billing plans
CREATE POLICY "billing_plans_authenticated_read" 
ON public.billing_plans 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create security audit log table for monitoring sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role can manage all audit logs
CREATE POLICY "service_role_audit_log" 
ON public.security_audit_log 
FOR ALL 
USING (auth.role() = 'service_role');

-- Users can only view their own audit logs
CREATE POLICY "users_view_own_audit_log" 
ON public.security_audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  action_type_param TEXT,
  resource_type_param TEXT,
  resource_id_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, 
    action_type, 
    resource_type, 
    resource_id, 
    metadata
  )
  VALUES (
    auth.uid(),
    action_type_param,
    resource_type_param,
    resource_id_param,
    metadata_param
  );
END;
$$;

-- Create trigger to log credit spending events
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
$$ LANGUAGE plpgsql SECURITY DEFINER;