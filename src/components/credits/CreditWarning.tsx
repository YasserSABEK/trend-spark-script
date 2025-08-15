import { useCreditBalance } from '@/hooks/useCreditBalance';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CreditWarning = () => {
  const { balance, plan } = useCreditBalance();

  if (!plan) return null;

  const warningThreshold = Math.floor(plan.monthly_credits * 0.2); // 20% of monthly limit
  const criticalThreshold = Math.floor(plan.monthly_credits * 0.1); // 10% of monthly limit

  if (balance <= criticalThreshold && plan.monthly_credits > 0) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            <strong>Critical:</strong> Only {balance} credits remaining! 
            Upgrade to continue using the service.
          </span>
          <Link to="/billing">
            <Button size="sm" className="ml-2">
              <Zap className="h-4 w-4 mr-1" />
              Upgrade Now
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (balance <= warningThreshold && plan.monthly_credits > 0) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            <strong>Low credits:</strong> You have {balance} credits remaining.
            Consider upgrading to avoid interruptions.
          </span>
          <Link to="/billing">
            <Button size="sm" variant="outline" className="ml-2">
              View Plans
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};