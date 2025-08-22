-- Drop the existing broad policy
DROP POLICY IF EXISTS "user_subscriptions_own" ON public.user_subscriptions;

-- Create more specific and secure RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
ON public.user_subscriptions
FOR ALL
TO service_role
USING (true);