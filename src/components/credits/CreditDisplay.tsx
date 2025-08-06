import { useCredits } from '@/hooks/useCredits';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, TrendingUp } from 'lucide-react';

export const CreditDisplay = () => {
  const { credits, loading } = useCredits();

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

  if (!credits) {
    return null;
  }

  const usagePercentage = credits.monthly_limit > 0 
    ? (credits.credits_used / credits.monthly_limit) * 100 
    : 0;

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'pro': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
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
          <Badge className={getPlanColor(credits.subscription_plan)}>
            {credits.subscription_plan}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-foreground">
              {credits.current_credits}
            </span>
            <span className="text-sm text-muted-foreground">
              /{credits.monthly_limit === -1 ? '∞' : credits.monthly_limit}
            </span>
          </div>
          
          {credits.monthly_limit !== -1 && (
            <>
              <Progress value={100 - usagePercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{credits.credits_used} used</span>
                <span>{credits.monthly_limit - credits.credits_used} remaining</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};