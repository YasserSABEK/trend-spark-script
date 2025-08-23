import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckoutForm } from './CheckoutForm';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface StripeCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  planSlug: string;
  planName: string;
  planPrice: number;
  planCredits: number;
}

export const StripeCheckout = ({ 
  isOpen, 
  onClose, 
  planSlug, 
  planName, 
  planPrice, 
  planCredits 
}: StripeCheckoutProps) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleOpen = async () => {
    if (!isOpen || clientSecret) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { planSlug }
      });

      if (error) throw error;
      
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Error",
        description: "Failed to initialize checkout. Please try again.",
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Initialize payment intent when dialog opens
  if (isOpen && !clientSecret && !loading) {
    handleOpen();
  }

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: 'hsl(329, 69%, 58%)',
      colorBackground: 'hsl(222.2, 84%, 4.9%)',
      colorText: 'hsl(210, 40%, 98%)',
      colorDanger: 'hsl(0, 62.8%, 30.6%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px',
    },
    rules: {
      '.Tab': {
        border: '1px solid hsl(217.2, 32.6%, 17.5%)',
        backgroundColor: 'hsl(217.2, 32.6%, 17.5%)',
        color: 'hsl(210, 40%, 98%)',
      },
      '.Tab:hover': {
        backgroundColor: 'hsl(217.2, 32.6%, 20%)',
      },
      '.Tab--selected': {
        backgroundColor: 'hsl(329, 69%, 58%)',
        color: 'white',
      },
      '.Input': {
        backgroundColor: 'hsl(217.2, 32.6%, 17.5%)',
        border: '1px solid hsl(217.2, 32.6%, 17.5%)',
        color: 'hsl(210, 40%, 98%)',
      },
      '.Input:focus': {
        borderColor: 'hsl(329, 69%, 58%)',
        boxShadow: '0 0 0 1px hsl(329, 69%, 58%)',
      },
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-instagram-pink to-instagram-purple bg-clip-text text-transparent">
            Upgrade to {planName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="bg-muted/50 rounded-lg p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{planName} Plan</h3>
              <div className="text-right">
                <div className="text-2xl font-bold">${planPrice}</div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{planCredits} credits per month</span>
            </div>
          </div>

          {/* Stripe Elements */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading checkout...</span>
            </div>
          ) : clientSecret ? (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm 
                planSlug={planSlug}
                onSuccess={() => {
                  toast({
                    title: "Success!",
                    description: "Your subscription has been activated.",
                  });
                  onClose();
                }}
                onError={(error) => {
                  toast({
                    title: "Payment Failed",
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
            </Elements>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};