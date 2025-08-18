-- Grant testing credits to Asher Gray's account
INSERT INTO public.credit_ledger (user_id, delta, reason, ref_type, created_at)
VALUES ('01606e46-8e81-4c4f-97c4-d02dee0c2313', 99997, 'testing_credits_grant', 'admin', now());

-- Update credit balance to 99999
UPDATE public.credit_balances 
SET balance = 99999, updated_at = now() 
WHERE user_id = '01606e46-8e81-4c4f-97c4-d02dee0c2313';