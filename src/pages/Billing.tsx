import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useRetryLogic } from "@/hooks/useRetryLogic";
import { useBillingErrorHandler } from "@/hooks/useBillingErrorHandler";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Crown, 
  Star, 
  Zap, 
  Check,
  ArrowUpCircle,
  ExternalLink,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ViraltifyCheckout } from "@/components/checkout/ViraltifyCheckout";
import { PageContainer } from "@/components/layout/PageContainer";
import { BillingErrorAlert } from "@/components/billing/BillingErrorAlert";


const plans = [
  {
    name: 'Free',
    slug: 'free',
    price: '$0',
    credits: 5,
    maxProfiles: 1,
    features: [
      '5 monthly credits',
      'Maximum 1 creator profile',
      'Basic features only',
      'Search results (50 items)',
      'Script generation',
      'Community support'
    ],
    icon: Star,
    popular: false
  },
  {
    name: 'Starter',
    slug: 'starter',
    price: '$19',
    credits: 50,
    maxProfiles: 'Unlimited',
    features: [
      '50 credits per month',
      'Unlimited creator profiles',
      'All search and generation features',
      'Script generation (1 credit)',
      'Basic analytics',
      'Email support'
    ],
    icon: Zap,
    popular: false
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: '$49',
    credits: 200,
    maxProfiles: 'Unlimited',
    features: [
      '200 credits per month',
      'Unlimited creator profiles',
      'Advanced analytics unlocked',
      'All search and generation features',
      'Priority support',
      'Custom integrations'
    ],
    icon: CreditCard,
    popular: true
  },
  {
    name: 'Agency',
    slug: 'agency',
    price: '$99',
    credits: 'Unlimited',
    maxProfiles: 'Unlimited',
    features: [
      'Unlimited credits (fair-use)',
      'Unlimited creator profiles',
      'Advanced analytics and insights',
      'Agency-level features',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'API access'
    ],
    icon: Crown,
    popular: false
  }
];

export default function Billing() {
  const { user } = useAuth();
  const { balance, loading, plan, subscription, checkSubscriptionStatus } = useCreditBalance();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [lastError, setLastError] = useState<any>(null);
  
  const { executeWithRetry, isRetrying } = useRetryLogic();
  const { handleBillingError } = useBillingErrorHandler();
  
  const handleUpgrade = (planSlug: string) => {
    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      return;
    }
    
    const planDetails = plans.find(p => p.slug === planSlug);
    if (planDetails) {
      setSelectedPlan(planDetails);
      setCheckoutOpen(true);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      toast.error('Please sign in to manage your subscription');
      return;
    }
    
    const result = await executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.error) {
        throw data;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
        setLastError(null); // Clear any previous errors on success
        return data;
      } else {
        throw new Error("No portal URL received");
      }
    }, {
      maxRetries: 2,
      baseDelay: 1000,
      onRetry: (attempt) => {
        toast.info(`Retrying billing portal access... (${attempt}/2)`);
      },
      onFinalError: (error) => {
        const errorDetails = handleBillingError(error, {
          onRetry: handleManageSubscription,
          showToast: false // We'll show our own error component
        });
        setLastError(errorDetails);
      }
    });

    if (!result) {
      // Error was handled in onFinalError
      return;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view billing</h1>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentPlan = plan?.slug || 'free';
  const usagePercentage = plan && plan.monthly_credits > 0 && balance 
    ? ((plan.monthly_credits - balance) / plan.monthly_credits) * 100 
    : 0;

  return (
    <PageContainer maxWidth="7xl" className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold mb-2">Simple Credit-Based Billing</h1>
          <p className="text-muted-foreground">
            Every action costs 1 credit. No complicated caching or wait times.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkSubscriptionStatus}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Error Alert */}
      {lastError && (
        <BillingErrorAlert
          error={lastError}
          onRetry={handleManageSubscription}
          showDetails={true}
        />
      )}

      {/* Current Plan Overview */}
      {plan && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Plan</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold capitalize">{plan.name}</p>
                  {currentPlan === 'pro' && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">Most Popular</Badge>
                  )}
                  {currentPlan === 'team' && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Team
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Credits Remaining</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">
                    {plan.slug === 'agency' ? 'Unlimited' : balance}
                    {plan.monthly_credits > 0 && plan.slug !== 'agency' && (
                      <span className="text-lg text-muted-foreground">/{plan.monthly_credits}</span>
                    )}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={checkSubscriptionStatus}
                    className="h-6 px-2 text-xs"
                  >
                    Refresh
                  </Button>
                </div>
                {plan.monthly_credits > 0 && plan.slug !== 'agency' && (
                  <Progress value={usagePercentage} className="h-2 mt-2" />
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Credits Used This Month</p>
                <p className="text-2xl font-bold">
                  {plan.slug === 'agency' ? 'Fair Use' : (plan.monthly_credits > 0 ? plan.monthly_credits - balance : 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.current_period_end 
                    ? `Resets ${new Date(subscription.current_period_end).toLocaleDateString()}` 
                    : plan.monthly_credits === 0 ? 'Pay per use' : 'No reset scheduled'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((planItem) => {
          const isCurrentPlan = planItem.slug === currentPlan;
          const PlanIcon = planItem.icon;
          
          return (
            <Card 
              key={planItem.name} 
              className={`relative h-full flex flex-col ${planItem.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'bg-primary/5 border-primary' : ''}`}
            >
              {planItem.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <div className={`p-3 rounded-full ${planItem.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <PlanIcon className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-xl">{planItem.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {planItem.price}
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription>
                  {typeof planItem.credits === 'string' ? planItem.credits : `${planItem.credits} credits per month`}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {typeof planItem.maxProfiles === 'string' ? planItem.maxProfiles : planItem.maxProfiles} creator profile{planItem.maxProfiles !== 1 ? 's' : ''}
                  </span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="space-y-2 flex-1">
                  {planItem.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-auto">
                  {isCurrentPlan ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={isRetrying}
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Opening Portal...
                        </>
                      ) : (
                        <>
                          Manage Subscription
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={planItem.popular ? "default" : "outline"}
                      onClick={() => handleUpgrade(planItem.slug)}
                      disabled={isRetrying}
                    >
                      Upgrade to {planItem.name}
                      <ArrowUpCircle className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Simplified Credit Usage */}
      <Card>
        <CardHeader>
          <CardTitle>How Credits Work</CardTitle>
          <CardDescription>
            Simple, transparent pricing - every action costs exactly 1 credit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Credit Costs</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Search Results (50 items)</span>
                  <Badge variant="outline">1 credit</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Script Generation</span>
                  <Badge variant="outline">1 credit</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">High Accuracy Script</span>
                  <Badge variant="outline">+1 credit</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Content Analysis</span>
                  <Badge variant="outline">1 credit</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">What's New</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✅ Immediate credit deduction - no waiting</p>
                <p>✅ No complicated caching system</p>
                <p>✅ Every action costs exactly 1 credit</p>
                <p>✅ Simple and transparent pricing</p>
                <p>✅ Credits work on all devices including mobile</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Modal */}
      {selectedPlan && (
        <ViraltifyCheckout
          isOpen={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            setSelectedPlan(null);
          }}
          planSlug={selectedPlan.slug}
          planName={selectedPlan.name}
          planPrice={parseInt(selectedPlan.price.replace('$', ''))}
          planCredits={selectedPlan.credits}
        />
      )}
    </PageContainer>
  );
}