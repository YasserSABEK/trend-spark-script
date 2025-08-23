import { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Lock } from 'lucide-react';

interface CheckoutFormProps {
  planSlug: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const CheckoutForm = ({ planSlug, onSuccess, onError }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/billing?success=true`,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'An unexpected error occurred.');
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  const isPaymentElementReady = stripe && elements;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="space-y-4">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Secured by Stripe</span>
        <Lock className="h-4 w-4" />
        <span>256-bit SSL encryption</span>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isPaymentElementReady || isLoading}
        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-instagram-pink to-instagram-purple hover:from-instagram-pink/90 hover:to-instagram-purple/90 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          'Complete Payment'
        )}
      </Button>

      {/* Terms */}
      <p className="text-xs text-muted-foreground text-center">
        By completing your purchase, you agree to our Terms of Service and Privacy Policy.
        Your subscription will automatically renew monthly.
      </p>
    </form>
  );
};