import { useAuth } from "@/components/auth/AuthContext";
import { useCredits } from "@/hooks/useCredits";
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
    price: '$0',
    credits: 10,
    features: [
      '10 credits per month',
      'Instagram searches (2 credits)',
      'Script generation (1 credit)',
      'Basic analytics'
    ],
    icon: Star,
    popular: false
  },
  {
    name: 'Pro',
    price: '$29',
    credits: 100,
    features: [
      '100 credits per month',
      'Instagram searches (2 credits)',
      'Script generation (1 credit)',
      'Advanced analytics',
      'Priority support',
      'Export features'
    ],
    icon: Zap,
    popular: true
  },
  {
    name: 'Premium',
    price: '$97',
    credits: -1, // Unlimited
    features: [
      'Unlimited credits',
      'Unlimited searches',
      'Unlimited script generation',
      'Advanced analytics',
      'Priority support',
      'Export features',
      'Custom integrations',
      'Dedicated account manager'
    ],
    icon: Crown,
    popular: false
  }
];

export default function Billing() {
  const { user } = useAuth();
  const { credits, loading } = useCredits();

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

  const currentPlan = credits?.subscription_plan || 'free';
  const usagePercentage = credits && credits.monthly_limit > 0 
    ? (credits.credits_used / credits.monthly_limit) * 100 
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
      {credits && (
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
                  <p className="text-2xl font-bold capitalize">{currentPlan}</p>
                  {currentPlan === 'pro' && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">Most Popular</Badge>
                  )}
                  {currentPlan === 'premium' && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Credits Remaining</p>
                <p className="text-2xl font-bold">
                  {credits.current_credits}
                  {credits.monthly_limit !== -1 && (
                    <span className="text-lg text-muted-foreground">/{credits.monthly_limit}</span>
                  )}
                </p>
                {credits.monthly_limit !== -1 && (
                  <Progress value={100 - usagePercentage} className="h-2 mt-2" />
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Credits Used This Month</p>
                <p className="text-2xl font-bold">{credits.credits_used}</p>
                <p className="text-sm text-muted-foreground">
                  Resets on {new Date(credits.billing_cycle_start).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.name.toLowerCase() === currentPlan;
          const PlanIcon = plan.icon;
          
          return (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'bg-primary/5 border-primary' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <div className={`p-3 rounded-full ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <PlanIcon className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription>
                  {plan.credits === -1 ? 'Unlimited credits' : `${plan.credits} credits per month`}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full" 
                  variant={isCurrentPlan ? "outline" : (plan.popular ? "default" : "outline")}
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
          <CardTitle>Credit Usage</CardTitle>
          <CardDescription>
            Understand how credits are used across different features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Credit Costs</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Instagram Profile Search</span>
                  <Badge variant="outline">2 credits</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Script Generation</span>
                  <Badge variant="outline">1 credit</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Usage Tips</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Search multiple profiles at once to maximize value</p>
                <p>• Generate scripts from successful viral content patterns</p>
                <p>• Use analytics to identify the best performing content types</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}