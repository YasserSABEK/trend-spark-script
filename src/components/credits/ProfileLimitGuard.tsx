import { ReactNode } from 'react';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Crown, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileLimitGuardProps {
  children: ReactNode;
  currentProfileCount: number;
}

export const ProfileLimitGuard = ({ children, currentProfileCount }: ProfileLimitGuardProps) => {
  const { plan } = useCreditBalance();

  // If no plan or unlimited profiles, allow access
  if (!plan || plan.max_profiles === -1) {
    return <>{children}</>;
  }

  // If user has reached their profile limit
  if (currentProfileCount >= plan.max_profiles) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Profile Limit Reached
            </DialogTitle>
            <DialogDescription>
              You've reached the maximum number of creator profiles ({plan.max_profiles}) for your {plan.name} plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Plan</span>
                <span className="text-sm capitalize">{plan.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Creator Profiles</span>
                <span className="text-sm font-medium">{currentProfileCount}/{plan.max_profiles}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Link to="/billing">
                <Button className="w-full" size="sm">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
              <Link to="/billing">
                <Button variant="outline" className="w-full" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
};