import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

interface CreditBalance {
  balance: number;
  last_reset: string;
  next_reset?: string;
}

interface Subscription {
  plan_slug: string;
  current_period_end: string;
  status: string;
}

interface BillingPlan {
  slug: string;
  name: string;
  monthly_credits: number;
  price_usd: number;
}

export const useCreditBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<BillingPlan | null>(null);

  const fetchBalance = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch credit balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('credit_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }

      setBalance(balanceData?.balance || 0);

      // Fetch subscription info
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!subError && subData) {
        setSubscription(subData);

        // Fetch plan details
        const { data: planData, error: planError } = await supabase
          .from('billing_plans')
          .select('*')
          .eq('slug', subData.plan_slug)
          .single();

        if (!planError && planData) {
          setPlan(planData);
        }
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error);
      toast.error('Failed to load credit balance');
    } finally {
      setLoading(false);
    }
  };

  const deductCredits = async (amount: number, reason: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('spend_credits', {
        user_id_param: user.id,
        amount_param: amount,
        reason_param: reason
      });

      if (error) throw error;

      const result = data as { ok: boolean; new_balance: number; error?: string };
      
      if (result?.ok) {
        setBalance(result.new_balance);
        toast.success(`Used ${amount} credit${amount > 1 ? 's' : ''}. Balance: ${result.new_balance}`);
        return true;
      } else {
        toast.error('Insufficient credits');
        return false;
      }
    } catch (error) {
      console.error('Error deducting credits:', error);
      toast.error('Failed to deduct credits');
      return false;
    }
  };

  const hasCredits = (amount: number): boolean => {
    return balance >= amount;
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  return {
    balance,
    loading,
    subscription,
    plan,
    fetchBalance,
    deductCredits,
    hasCredits,
    nextReset: subscription?.current_period_end
  };
};