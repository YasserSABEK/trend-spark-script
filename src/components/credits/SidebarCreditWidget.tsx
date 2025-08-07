import { useCredits } from '@/hooks/useCredits';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap } from 'lucide-react';

interface SidebarCreditWidgetProps {
  collapsed?: boolean;
}

export function SidebarCreditWidget({ collapsed }: SidebarCreditWidgetProps) {
  const { credits, loading } = useCredits();

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  if (!credits) return null;

  const usagePercentage = credits.monthly_limit > 0 
    ? Math.min((credits.credits_used / credits.monthly_limit) * 100, 100)
    : 0;

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
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
        <span className="text-xs font-medium">{credits.current_credits}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Credits</span>
        <Badge variant={getPlanColor(credits.subscription_plan)} className="text-xs">
          {credits.subscription_plan}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Available</span>
          <span className="font-medium">{credits.current_credits}</span>
        </div>
        
        {credits.monthly_limit > 0 && (
          <>
            <Progress value={usagePercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{credits.credits_used} used</span>
              <span>{credits.monthly_limit} limit</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}