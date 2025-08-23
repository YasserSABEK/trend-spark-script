import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  CreditCard, 
  Check, 
  Star, 
  Zap, 
  Crown,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { trackEvent } from '@/lib/analytics';

const plans = [
  {
    name: 'Creator',
    slug: 'creator',
    price: 19,
    credits: 75,
    features: [
      "75 AI-generated scripts per month",
      "Advanced trending discovery", 
      "Performance analytics",
      "Priority support",
      "Export to all platforms"
    ],
    icon: Zap,
    popular: false
  },
  {
    name: 'Pro',
    slug: 'pro', 
    price: 39,
    credits: 200,
    features: [
      "200 AI-generated scripts per month",
      "Unlimited trending discovery",
      "Advanced analytics & insights", 
      "Priority support",
      "Team collaboration (3 members)",
      "Custom brand voice training"
    ],
    icon: CreditCard,
    popular: true
  },
  {
    name: 'Team',
    slug: 'team',
    price: 94,
    credits: 700,
    features: [
      "700 AI-generated scripts per month",
      "Unlimited everything",
      "Advanced team analytics",
      "Dedicated account manager", 
      "Unlimited team members",
      "Custom integrations"
    ],
    icon: Crown,
    popular: false
  }
];

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  
  const planSlug = searchParams.get('plan');
  const plan = plans.find(p => p.slug === planSlug);

  useEffect(() => {
    // Track checkout page view
    if (planSlug && plan) {
      trackEvent('checkout_viewed', 'subscription', planSlug);
    }
  }, [planSlug, plan]);

  useEffect(() => {
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent(`/checkout?plan=${planSlug}`));
      return;
    }
    
    if (!plan) {
      navigate('/billing');
      return;
    }
  }, [user, plan, planSlug, navigate]);

  const handleCheckout = async () => {
    if (!user || !plan) return;
    
    setLoading(true);
    setCheckoutStep(2);
    
    try {
      trackEvent('begin_checkout', 'subscription', plan.slug, plan.price);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planSlug: plan.slug }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      window.location.href = data.url;
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setCheckoutStep(1);
      toast.error('Failed to start checkout process. Please try again.');
      
      trackEvent('checkout_error', 'subscription', plan.slug);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const PlanIcon = plan.icon;

  return (
    <PageContainer maxWidth="7xl" className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/billing')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Billing
          </Button>
          <div className="h-6 w-px bg-border" />
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Billing</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Checkout</span>
          </nav>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            checkoutStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            checkoutStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Plan Details */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <PlanIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{plan.name} Plan</CardTitle>
                  <p className="text-muted-foreground">{plan.credits} credits per month</p>
                </div>
                {plan.popular && (
                  <Badge className="ml-auto bg-blue-100 text-blue-800 border-blue-200">
                    Most Popular
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold">${plan.price}</div>
                <div className="text-muted-foreground">per month</div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">What's included:</h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compare Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plans.map((p) => (
                  <div key={p.slug} className={`flex items-center justify-between p-3 rounded-lg border ${
                    p.slug === plan.slug ? 'border-primary bg-primary/5' : 'border-border'
                  }`}>
                    <div className="flex items-center gap-3">
                      <p.icon className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.credits} credits</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${p.price}/mo</p>
                      {p.slug === plan.slug && (
                        <Badge variant="secondary" className="text-xs">Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Checkout */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>{plan.name} Plan (Monthly)</span>
                  <span>${plan.price}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Credits per month</span>
                  <span>{plan.credits}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${plan.price}/month</span>
                </div>
              </div>

              {/* Security Indicators */}
              <div className="grid grid-cols-1 gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Secured by Stripe</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {checkoutStep === 2 ? 'Redirecting to Stripe...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Complete Purchase
                  </>
                )}
              </Button>

              {/* Progress Bar */}
              {loading && (
                <div className="space-y-2">
                  <Progress value={checkoutStep === 2 ? 75 : 25} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    {checkoutStep === 2 ? 'Preparing secure checkout...' : 'Processing request...'}
                  </p>
                </div>
              )}

              {/* Terms */}
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                Your subscription will automatically renew monthly. Cancel anytime from your billing settings.
              </p>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <h4 className="font-medium">Need help?</h4>
                <p className="text-sm text-muted-foreground">
                  Our support team is here to help you get started
                </p>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}