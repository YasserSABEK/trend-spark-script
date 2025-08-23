import { AlertTriangle, ExternalLink, RefreshCw, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface BillingErrorAlertProps {
  error: {
    code: string;
    message: string;
    actionText?: string;
    actionHandler?: () => void;
    setupUrl?: string;
  };
  onRetry?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const BillingErrorAlert = ({ 
  error, 
  onRetry, 
  showDetails = false,
  className = "" 
}: BillingErrorAlertProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getErrorIcon = () => {
    switch (error.code) {
      case 'AUTHENTICATION_FAILED':
        return '🔒';
      case 'PORTAL_CONFIGURATION_REQUIRED':
        return '⚙️';
      case 'CONFIGURATION_ERROR':
        return '🔧';
      default:
        return '⚠️';
    }
  };

  const getErrorSeverity = () => {
    switch (error.code) {
      case 'AUTHENTICATION_FAILED':
      case 'PORTAL_CONFIGURATION_REQUIRED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getErrorSeverity() as any} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getErrorIcon()}</span>
          <span className="font-medium">{error.message}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {error.actionHandler && (
            <Button
              variant="outline"
              size="sm"
              onClick={error.actionHandler}
              className="h-8"
            >
              {error.actionText === 'Setup Guide' && <ExternalLink className="mr-1 h-3 w-3" />}
              {error.actionText === 'Retry' && <RefreshCw className="mr-1 h-3 w-3" />}
              {error.actionText === 'Contact Support' && <Mail className="mr-1 h-3 w-3" />}
              {error.actionText}
            </Button>
          )}

          {onRetry && error.actionText !== 'Retry' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Retry
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('mailto:support@viraltify.com', '_blank')}
            className="h-8"
          >
            <Mail className="mr-1 h-3 w-3" />
            Contact Support
          </Button>
        </div>

        {showDetails && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto text-xs text-muted-foreground">
                {isOpen ? 'Hide' : 'Show'} technical details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-2 bg-muted rounded text-xs font-mono">
              <div><strong>Error Code:</strong> {error.code}</div>
              {error.setupUrl && (
                <div><strong>Setup URL:</strong> {error.setupUrl}</div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </AlertDescription>
    </Alert>
  );
};