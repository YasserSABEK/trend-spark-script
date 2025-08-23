import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, ArrowRight, Home } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { trackEvent } from '@/lib/analytics';
import { useCreditBalance } from '@/hooks/useCreditBalance';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscriptionStatus } = useCreditBalance();
  
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // Track successful checkout
    if (sessionId) {
      trackEvent('purchase', 'subscription', sessionId);
    }
    
    // Refresh subscription status
    checkSubscriptionStatus();
  }, [sessionId, checkSubscriptionStatus]);

  return (
    <PageContainer maxWidth="md" className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-lg border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-2xl text-green-800">Payment Successful!</CardTitle>
            <p className="text-green-600 mt-2">Welcome to your upgraded plan</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CreditCard className="h-3 w-3 mr-1" />
              Subscription Active
            </Badge>
            <p className="text-sm text-muted-foreground">
              Your payment has been processed and your subscription is now active.
              You should receive a confirmation email shortly.
            </p>
          </div>

          <div className="bg-white/80 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-green-800">What's Next?</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Your credits have been added to your account</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Access all premium features immediately</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Manage your subscription anytime from billing</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/billing')}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              View Billing
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Questions? Contact our support team anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}