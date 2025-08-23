import { useCreditBalance } from '@/hooks/useCreditBalance';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, TrendingDown } from 'lucide-react';

export const CreditDisplay = () => {
  const { balance, loading, plan, dailyUsage } = useCreditBalance();

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading credits...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return null;
  }

  const usagePercentage = plan.monthly_credits > 0 && plan.slug !== 'agency'
    ? Math.min(((plan.monthly_credits - balance) / plan.monthly_credits) * 100, 100)
    : 0;

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'starter': return 'bg-green-100 text-green-800 border-green-200';
      case 'pro': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'agency': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Credits</span>
          </div>
          <Badge className={getPlanColor(plan.name)}>
            {plan.name}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-foreground">
              {plan.slug === 'agency' ? 'Unlimited' : balance}
            </span>
            <span className="text-sm text-muted-foreground">
              {plan.slug === 'agency' ? '' : `/${plan.monthly_credits === 0 ? '∞' : plan.monthly_credits}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Used Today</span>
            </div>
            <span className="font-medium">{dailyUsage}</span>
          </div>
          
          {plan.monthly_credits > 0 && plan.slug !== 'agency' && (
            <>
              <Progress value={100 - usagePercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{plan.monthly_credits - balance} used</span>
                <span>{balance} remaining</span>
              </div>
            </>
          )}
          
          {plan.slug === 'agency' && (
            <div className="text-xs text-muted-foreground text-center">
              Fair-use policy applies
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};