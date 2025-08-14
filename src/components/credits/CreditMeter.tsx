import { useCreditBalance } from '@/hooks/useCreditBalance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Coins, Plus, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreditMeterProps {
  showDetailed?: boolean;
  compact?: boolean;
}

export const CreditMeter = ({ showDetailed = false, compact = false }: CreditMeterProps) => {
  const { balance, loading, plan, nextReset } = useCreditBalance();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const formatNextReset = (dateString?: string) => {
    if (!dateString) return 'No reset scheduled';
    const resetDate = new Date(dateString);
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Resets today';
    if (diffDays === 1) return 'Resets tomorrow';
    return `Resets in ${diffDays} days`;
  };

  if (showDetailed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <span className="font-medium">Credits</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{balance}</span>
            {plan && (
              <Badge variant="outline">
                {plan.name}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {formatNextReset(nextReset)}
        </div>

        <div className="flex gap-2">
          <Link to="/billing" className="flex-1">
            <Button size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Buy Credits
            </Button>
          </Link>
          <Link to="/billing">
            <Button size="sm" variant="outline">
              <Zap className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/billing">
              <Button variant="outline" size="sm" className="gap-1 h-8 px-2 text-xs">
                <Coins className="w-3 h-3" />
                <span>{balance}</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{balance} credits remaining</div>
              {plan && <div className="text-sm">Plan: {plan.name}</div>}
              <div className="text-sm text-muted-foreground">
                {formatNextReset(nextReset)}
              </div>
              <div className="text-sm">Click to manage billing</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/billing">
            <Button variant="outline" size="sm" className="gap-2">
              <Coins className="w-4 h-4" />
              <span>{balance}</span>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <div className="font-medium">{balance} credits remaining</div>
            {plan && <div className="text-sm">Plan: {plan.name}</div>}
            <div className="text-sm text-muted-foreground">
              {formatNextReset(nextReset)}
            </div>
            <div className="text-sm">Click to manage billing</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};