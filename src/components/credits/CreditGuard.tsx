import { ReactNode } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Coins, Zap } from 'lucide-react';

interface CreditGuardProps {
  children: ReactNode;
  requiredCredits: number;
  action: string;
  onProceed?: () => void;
}

export const CreditGuard = ({ children, requiredCredits, action, onProceed }: CreditGuardProps) => {
  const { credits, hasCredits } = useCredits();

  if (!credits || hasCredits(requiredCredits)) {
    return <>{children}</>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Insufficient Credits
          </DialogTitle>
          <DialogDescription>
            You need {requiredCredits} credits to {action}, but you only have {credits.current_credits} credits remaining.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Plan</span>
              <span className="text-sm capitalize">{credits.subscription_plan}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Credits Remaining</span>
              <span className="text-sm font-medium">{credits.current_credits}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button className="w-full" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              View Pricing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};