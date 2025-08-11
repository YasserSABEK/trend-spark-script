import { useAuth } from "@/components/auth/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
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
  ArrowUpCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: 'Free',
    slug: 'free',
    price: '$0',
    credits: 0,
    features: [
      '0 monthly credits',
      'Search results in 50-item chunks (1 credit each)',
      'Script generation (1 credit)',
      'High accuracy scripts (+1 credit)',
      'Cached results free for 10 minutes'
    ],
    icon: Star,
    popular: false
  },
  {
    name: 'Creator',
    slug: 'creator',
    price: '$19',
    credits: 75,
    features: [
      '75 credits per month',
      'Search results in 50-item chunks (1 credit each)',
      'Script generation (1 credit)',
      'High accuracy scripts (+1 credit)',
      'Cached results free for 10 minutes',
      'Basic analytics'
    ],
    icon: Zap,
    popular: false
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: '$39',
    credits: 200,
    features: [
      '200 credits per month',
      'Search results in 50-item chunks (1 credit each)',
      'Script generation (1 credit)',
      'High accuracy scripts (+1 credit)',
      'Cached results free for 10 minutes',
      'Advanced analytics',
      'Priority support'
    ],
    icon: CreditCard,
    popular: true
  },
  {
    name: 'Team',
    slug: 'team',
    price: '$94',
    credits: 700,
    features: [
      '700 credits per month',
      'Search results in 50-item chunks (1 credit each)',
      'Script generation (1 credit)',
      'High accuracy scripts (+1 credit)',
      'Cached results free for 10 minutes',
      'Advanced analytics',
      'Priority support',
      'Team collaboration features',
      'Custom integrations'
    ],
    icon: Crown,
    popular: false
  }
];

export default function Billing() {
  const { user } = useAuth();
  const { balance, loading, plan, subscription } = useCreditBalance();

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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view usage details
        </p>
      </div>

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
                <p className="text-2xl font-bold">
                  {balance}
                  {plan.monthly_credits > 0 && (
                    <span className="text-lg text-muted-foreground">/{plan.monthly_credits}</span>
                  )}
                </p>
                {plan.monthly_credits > 0 && (
                  <Progress value={usagePercentage} className="h-2 mt-2" />
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Credits Used This Month</p>
                <p className="text-2xl font-bold">{plan.monthly_credits > 0 ? plan.monthly_credits - balance : 0}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.current_period_end 
                    ? `Resets ${new Date(subscription.current_period_end).toLocaleDateString()}` 
                    : 'No reset scheduled'
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
              className={`relative ${planItem.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'bg-primary/5 border-primary' : ''}`}
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
                  {planItem.credits === 0 ? 'Pay per use' : `${planItem.credits} credits per month`}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {planItem.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full" 
                  variant={isCurrentPlan ? "outline" : (planItem.popular ? "default" : "outline")}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    <>
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      {currentPlan === 'free' ? 'Upgrade' : 'Switch Plan'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Credit Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage & Billing</CardTitle>
          <CardDescription>
            Understand how credits work with our chunked search system
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
                  <span className="text-sm">Cached Results (≤10 min)</span>
                  <Badge variant="secondary">Free</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">How It Works</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Searches return results in 50-item chunks</p>
                <p>• "Deep Hashtag (100)" = 2 chunks = 2 credits</p>
                <p>• Cached results are free for 10 minutes</p>
                <p>• Top-ups available: 25 ($5), 75 ($10), 150 ($15)</p>
                <p>• All plans include cached result benefits</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}