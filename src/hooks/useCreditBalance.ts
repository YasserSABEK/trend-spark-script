import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

interface CreditBalance {
  balance: number;
  last_reset: string;
  next_reset?: string;
}

interface DailyUsage {
  credits_used: number;
  date: string;
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
  max_profiles: number;
  has_advanced_analytics: boolean;
}

export const useCreditBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<BillingPlan | null>(null);
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  const [monthlyUsage, setMonthlyUsage] = useState<number>(0);

  // Function to check subscription status via Stripe
  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      console.log('Subscription status checked:', data);
      // Refresh balance after checking subscription
      await fetchBalance();
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const fetchBalance = async () => {
    if (!user) {
      console.log('[useCreditBalance] No user found, skipping balance fetch');
      setLoading(false);
      return;
    }

    console.log('[useCreditBalance] Fetching balance for user:', user.id);

    try {
      // Fetch credit balance with timeout
      const balancePromise = supabase
        .from('credit_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: balanceData, error: balanceError } = await Promise.race([
        balancePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Balance fetch timeout')), 10000)
        )
      ]) as any;

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('[useCreditBalance] Balance fetch error:', balanceError);
        // Don't throw, just set default values
        setBalance(0);
      } else {
        const balance = balanceData?.balance || 0;
        console.log('[useCreditBalance] Balance fetched:', balance);
        setBalance(balance);
      }

      // Fetch subscription info with error handling
      try {
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!subError && subData) {
          console.log('[useCreditBalance] Subscription data:', subData);
          setSubscription(subData);

          // Fetch plan details
          try {
            const { data: planData, error: planError } = await supabase
              .from('billing_plans')
              .select('*')
              .eq('slug', subData.plan_slug)
              .maybeSingle();

            if (!planError && planData) {
              console.log('[useCreditBalance] Plan data:', planData);
              setPlan(planData);
            } else if (planError) {
              console.error('[useCreditBalance] Plan fetch error:', planError);
            }
          } catch (planFetchError) {
            console.error('[useCreditBalance] Plan fetch exception:', planFetchError);
          }
        } else if (subError) {
          console.error('[useCreditBalance] Subscription fetch error:', subError);
        }
      } catch (subFetchError) {
        console.error('[useCreditBalance] Subscription fetch exception:', subFetchError);
      }

      // Fetch daily usage
      try {
        const { data: usageData, error: usageError } = await supabase
          .from('daily_credit_usage')
          .select('credits_used')
          .eq('user_id', user.id)
          .eq('date', new Date().toISOString().split('T')[0])
          .maybeSingle();

        if (!usageError && usageData) {
          console.log('[useCreditBalance] Daily usage:', usageData.credits_used);
          setDailyUsage(usageData.credits_used);
        } else {
          setDailyUsage(0);
        }
      } catch (usageError) {
        console.error('[useCreditBalance] Daily usage fetch error:', usageError);
        setDailyUsage(0);
      }

      // Fetch monthly usage using the new function
      try {
        const { data: monthlyData, error: monthlyError } = await supabase.rpc('get_monthly_credit_usage', {
          user_id_param: user.id
        });

        if (!monthlyError) {
          console.log('[useCreditBalance] Monthly usage:', monthlyData);
          setMonthlyUsage(monthlyData || 0);
        } else {
          console.error('[useCreditBalance] Monthly usage fetch error:', monthlyError);
          setMonthlyUsage(0);
        }
      } catch (monthlyUsageError) {
        console.error('[useCreditBalance] Monthly usage fetch exception:', monthlyUsageError);
        setMonthlyUsage(0);
      }
    } catch (error) {
      console.error('[useCreditBalance] Critical error fetching credit balance:', error);
      // Set fallback values instead of showing error
      setBalance(0);
      setSubscription(null);
      setPlan(null);
    } finally {
      setLoading(false);
      console.log('[useCreditBalance] Balance fetch completed');
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
        const displayBalance = plan?.slug === 'agency' ? 'unlimited' : result.new_balance;
        toast.success(`Used ${amount} credit${amount > 1 ? 's' : ''}. Balance: ${displayBalance}`);
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
    // Agency plan has unlimited credits
    if (plan?.slug === 'agency') return true;
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
    dailyUsage,
    monthlyUsage,
    fetchBalance,
    deductCredits,
    hasCredits,
    nextReset: subscription?.current_period_end,
    checkSubscriptionStatus
  };
};