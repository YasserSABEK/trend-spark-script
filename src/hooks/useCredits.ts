import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

interface CreditInfo {
  current_credits: number;
  monthly_limit: number;
  credits_used: number;
  subscription_plan: string;
  billing_cycle_start: string;
}

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_credits', {
        user_id_param: user.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setCredits(data[0]);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      toast.error('Failed to load credit information');
    } finally {
      setLoading(false);
    }
  };

  const deductCredits = async (amount: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('deduct_credits', {
        user_id_param: user.id,
        credits_to_deduct: amount
      });

      if (error) throw error;

      if (data) {
        // Refresh credits after successful deduction
        await fetchCredits();
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

  const addCredits = async (amount: number) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('add_credits', {
        user_id_param: user.id,
        credits_to_add: amount
      });

      if (error) throw error;

      await fetchCredits();
      toast.success(`Added ${amount} credits`);
    } catch (error) {
      console.error('Error adding credits:', error);
      toast.error('Failed to add credits');
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  return {
    credits,
    loading,
    fetchCredits,
    deductCredits,
    addCredits,
    hasCredits: (amount: number) => credits ? credits.current_credits >= amount : false
  };
};