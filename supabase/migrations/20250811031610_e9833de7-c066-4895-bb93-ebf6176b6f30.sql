-- Create billing_plans table
CREATE TABLE public.billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  monthly_credits INTEGER NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  plan_slug TEXT REFERENCES public.billing_plans(slug),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT CHECK (status IN ('trial', 'active', 'past_due', 'canceled')) DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create credit_balances table
CREATE TABLE public.credit_balances (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create credit_ledger table
CREATE TABLE public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT,
  ref_type TEXT,
  ref_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create credit_topups table
CREATE TABLE public.credit_topups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  credits INTEGER NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  provider TEXT,
  provider_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create search_cache table
CREATE TABLE public.search_cache (
  cache_key TEXT PRIMARY KEY,
  chunk_size INTEGER NOT NULL DEFAULT 50,
  items JSONB NOT NULL,
  total_count INTEGER,
  fetched_at TIMESTAMPTZ NOT NULL,
  source_run_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indices for performance
CREATE INDEX idx_credit_ledger_user_created ON public.credit_ledger(user_id, created_at DESC);
CREATE INDEX idx_user_subscriptions_plan ON public.user_subscriptions(plan_slug);
CREATE INDEX idx_search_cache_fetched ON public.search_cache(fetched_at DESC);

-- Enable RLS
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for billing_plans (public read)
CREATE POLICY "billing_plans_public_read" ON public.billing_plans FOR SELECT USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "user_subscriptions_own" ON public.user_subscriptions FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for credit_balances
CREATE POLICY "credit_balances_own" ON public.credit_balances FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for credit_ledger
CREATE POLICY "credit_ledger_own" ON public.credit_ledger FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for credit_topups
CREATE POLICY "credit_topups_own" ON public.credit_topups FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for search_cache (edge functions only)
CREATE POLICY "search_cache_admin" ON public.search_cache FOR ALL USING (true);

-- Insert seed billing plans
INSERT INTO public.billing_plans (slug, name, monthly_credits, price_usd, is_default) VALUES
  ('free', 'Free', 0, 0.00, true),
  ('creator', 'Creator', 75, 19.00, false),
  ('pro', 'Pro', 200, 39.00, false),
  ('team', 'Team', 700, 94.00, false);

-- Create spend_credits function
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

-- Create grant_monthly_credits function
CREATE OR REPLACE FUNCTION public.grant_monthly_credits()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Update handle_new_user function to include signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Create default subscription (free plan)
  INSERT INTO public.user_subscriptions (user_id, plan_slug, status)
  VALUES (NEW.id, 'free', 'trial');
  
  -- Grant signup bonus
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type)
  VALUES (NEW.id, 10, 'signup_bonus', 'system');
  
  -- Initialize credit balance
  INSERT INTO public.credit_balances (user_id, balance)
  VALUES (NEW.id, 10);
  
  RETURN NEW;
END;
$$;