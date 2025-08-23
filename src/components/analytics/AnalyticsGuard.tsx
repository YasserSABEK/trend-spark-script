import { ReactNode } from 'react';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, BarChart3, Crown, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AnalyticsGuardProps {
  children: ReactNode;
  feature?: string;
}

export const AnalyticsGuard = ({ children, feature = "Advanced Analytics" }: AnalyticsGuardProps) => {
  const { plan } = useCreditBalance();

  // If user has access to analytics (Pro or Agency plan)
  if (plan?.has_advanced_analytics) {
    return <>{children}</>;
  }

  // Show locked state for Free and Starter users
  return (
    <Card className="relative">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">{feature} Locked</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to Pro or Agency plan to unlock advanced analytics and insights.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/billing">
              <Button size="sm" className="w-full">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </Link>
            <Link to="/billing">
              <Button variant="outline" size="sm" className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Blurred background content */}
      <div className="opacity-50 pointer-events-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {feature}
          </CardTitle>
          <CardDescription>
            Advanced insights and analytics for your content strategy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};