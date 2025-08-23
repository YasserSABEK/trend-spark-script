import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { trackEvent } from '@/lib/analytics';

export default function CheckoutCancel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const planSlug = searchParams.get('plan');
  
  useEffect(() => {
    // Track checkout cancellation
    if (planSlug) {
      trackEvent('checkout_cancelled', 'subscription', planSlug);
    }
  }, [planSlug]);

  const handleRetryCheckout = () => {
    if (planSlug) {
      navigate(`/checkout?plan=${planSlug}`);
    } else {
      navigate('/billing');
    }
  };

  return (
    <PageContainer maxWidth="md" className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-lg border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-2xl text-orange-800">Checkout Cancelled</CardTitle>
            <p className="text-orange-600 mt-2">Your payment was not processed</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              No charges were made to your payment method. 
              You can try again or return to billing to choose a different plan.
            </p>
          </div>

          <div className="bg-white/80 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-orange-800">What happened?</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Payment was cancelled during checkout</p>
              <p>• No charges were made to your account</p>
              <p>• Your current plan remains unchanged</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/billing')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Billing
            </Button>
            <Button 
              onClick={handleRetryCheckout}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Still having issues?</p>
            <Button variant="ghost" size="sm">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}