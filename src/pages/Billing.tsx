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
  RefreshCw,
  HelpCircle,
  DollarSign,
  Settings,
  Shield,
  Users,
  BookOpen,
  Mail
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Everything you need to know about Viraltify billing and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            
            {/* Billing & Credits */}
            <AccordionItem value="how-credits-work">
              <AccordionTrigger className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                How do credits work?
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Simple, transparent pricing - every action costs exactly 1 credit:
                  </p>
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="run-out-credits">
              <AccordionTrigger>What happens when I run out of credits?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  When you run out of credits, you'll need to upgrade your plan or wait for your monthly credits to reset. 
                  Free users get 5 credits per month, while paid plans offer 50+ credits depending on your subscription.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="purchase-additional-credits">
              <AccordionTrigger>Can I purchase additional credits?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Currently, credits are included with your monthly plan and reset each billing cycle. 
                  For higher usage, consider upgrading to a plan with more credits or the Agency plan with unlimited fair-use credits.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="billing-cycle">
              <AccordionTrigger>How does billing work for different plans?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Free:</strong> No billing - 5 credits per month</p>
                  <p><strong>Starter ($19/month):</strong> 50 credits monthly, billed monthly</p>
                  <p><strong>Pro ($49/month):</strong> 200 credits monthly, billed monthly</p>
                  <p><strong>Agency ($99/month):</strong> Unlimited fair-use credits, billed monthly</p>
                  <p>All paid plans include unlimited creator profiles and advanced features.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="change-plans">
              <AccordionTrigger>Can I change plans anytime?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan anytime. Changes take effect immediately for upgrades, 
                  while downgrades take effect at the end of your current billing cycle. Any unused credits don't roll over.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refunds">
              <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  We offer a 30-day money-back guarantee for first-time subscribers. 
                  If you're not satisfied with Viraltify, contact our support team within 30 days of your first payment for a full refund.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment-methods">
              <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards (Visa, MasterCard, American Express) and PayPal through our secure Stripe payment processor. 
                  All payments are encrypted and processed securely.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Account & Subscription */}
            <AccordionItem value="free-trial">
              <AccordionTrigger className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Is there a free trial?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Yes! Our Free plan gives you 5 credits per month to try Viraltify. 
                  You can create 1 creator profile and test all basic features before upgrading to a paid plan.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancel-subscription">
              <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  You can cancel anytime by clicking "Manage Subscription" on this page, which opens your customer portal. 
                  Your subscription will remain active until the end of your current billing period.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data-after-cancel">
              <AccordionTrigger>What happens to my data if I cancel?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Your account and data remain accessible after cancellation, but you'll revert to the Free plan limits (5 credits/month, 1 profile). 
                  All your saved creators, scripts, and analytics remain available.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="credits-rollover">
              <AccordionTrigger>Do unused credits roll over?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  No, unused credits reset at the beginning of each billing cycle. 
                  This keeps our pricing simple and ensures you get fresh credits every month.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Features & Usage */}
            <AccordionItem value="what-counts-credit">
              <AccordionTrigger className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                What exactly counts as 1 credit?
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Each of these actions costs exactly 1 credit:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Searching for viral content (returns 50 results)</li>
                    <li>Generating a script from a video</li>
                    <li>Analyzing content performance</li>
                    <li>Creating a creator profile analysis</li>
                  </ul>
                  <p>High accuracy script generation costs an additional +1 credit (2 total).</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ai-accuracy">
              <AccordionTrigger>How accurate are the AI-generated scripts?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes successful viral content patterns and generates scripts optimized for engagement. 
                  While results vary, our users typically see 30-50% better performance compared to non-optimized content. 
                  The "High Accuracy" option uses advanced models for even better results.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="export-content">
              <AccordionTrigger>Can I export my generated content?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Yes! All generated scripts and analysis can be copied and exported. 
                  Pro and Agency plans also include CSV export for bulk data analysis.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="platforms-supported">
              <AccordionTrigger>What platforms do you support?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Viraltify currently supports:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>TikTok - Creator research, hashtag analysis, script generation</li>
                    <li>Instagram Reels - Content analysis and script optimization</li>
                    <li>YouTube Shorts - Coming soon</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Technical & Support */}
            <AccordionItem value="data-security">
              <AccordionTrigger className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Is my data secure?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Absolutely. We use enterprise-grade security with encrypted data storage, secure API connections, 
                  and comply with GDPR and CCPA privacy regulations. Your account data and generated content are never shared with third parties.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer-support">
              <AccordionTrigger className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Do you offer customer support?
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Yes! Support varies by plan:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Free:</strong> Community support and help docs</li>
                    <li><strong>Starter:</strong> Email support (24-48 hour response)</li>
                    <li><strong>Pro:</strong> Priority email support (12-24 hour response)</li>
                    <li><strong>Agency:</strong> Dedicated support with priority access</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="api-access">
              <AccordionTrigger>Do you have an API?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  API access is available for Agency plan subscribers. 
                  This allows you to integrate Viraltify's content analysis and script generation into your own applications and workflows.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="service-downtime">
              <AccordionTrigger>What happens if the service is down?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  We maintain 99.9% uptime and monitor our services 24/7. 
                  If there are any issues, we'll update our status page and provide timeline estimates. 
                  Credits are never deducted for failed requests due to service issues.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="get-help">
              <AccordionTrigger>How do I get help?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Multiple ways to get help:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Check our knowledge base and documentation</li>
                    <li>Email support@viraltify.com for technical issues</li>
                    <li>Use the in-app chat for quick questions</li>
                    <li>Join our community Discord for tips and tricks</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
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