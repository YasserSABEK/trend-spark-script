import { useCreditBalance } from '@/hooks/useCreditBalance';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap } from 'lucide-react';

interface SidebarCreditWidgetProps {
  collapsed?: boolean;
}

export function SidebarCreditWidget({ collapsed }: SidebarCreditWidgetProps) {
  const { balance, loading, plan } = useCreditBalance();

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  if (!plan) return null;

  const usagePercentage = plan.monthly_credits > 0 
    ? Math.min(((plan.monthly_credits - balance) / plan.monthly_credits) * 100, 100)
    : 0;

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'pro':
        return 'default';
      case 'premium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center space-y-1 p-1">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">{balance}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Credits</span>
        <Badge variant={getPlanColor(plan.name)} className="text-xs">
          {plan.name}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Available</span>
          <span className="font-medium">{balance}</span>
        </div>
        
        {plan.monthly_credits > 0 && (
          <>
            <Progress value={usagePercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{plan.monthly_credits - balance} used</span>
              <span>{plan.monthly_credits} limit</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}