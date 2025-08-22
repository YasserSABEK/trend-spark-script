-- Enhance RLS policies for credit_balances table
DROP POLICY IF EXISTS "credit_balances_own" ON public.credit_balances;

CREATE POLICY "Users can view their own credit balance"
ON public.credit_balances
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credit balances"
ON public.credit_balances
FOR ALL
TO service_role
USING (true);

-- Enhance RLS policies for credit_ledger table
DROP POLICY IF EXISTS "credit_ledger_own" ON public.credit_ledger;

CREATE POLICY "Users can view their own credit transactions"
ON public.credit_ledger
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credit transactions"
ON public.credit_ledger
FOR ALL
TO service_role
USING (true);

-- Enhance RLS policies for credit_topups table
DROP POLICY IF EXISTS "credit_topups_own" ON public.credit_topups;

CREATE POLICY "Users can view their own credit topups"
ON public.credit_topups
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credit topups"
ON public.credit_topups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credit topups"
ON public.credit_topups
FOR ALL
TO service_role
USING (true);