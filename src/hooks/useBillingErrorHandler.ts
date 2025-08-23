import { useCallback } from 'react';
import { toast } from 'sonner';

interface BillingError {
  error?: string;
  message?: string;
  action?: string;
  setup_url?: string;
}

interface ErrorHandlerOptions {
  onRetry?: () => void;
  onContactSupport?: () => void;
  showToast?: boolean;
}

export const useBillingErrorHandler = () => {
  const handleBillingError = useCallback((
    error: BillingError | Error | string,
    options: ErrorHandlerOptions = {}
  ) => {
    const { onRetry, onContactSupport, showToast = true } = options;

    let errorCode: string;
    let message: string;
    let actionType: string;
    let setupUrl: string | undefined;

    // Parse error object
    if (typeof error === 'string') {
      errorCode = 'UNKNOWN_ERROR';
      message = error;
      actionType = 'retry';
    } else if (error instanceof Error) {
      errorCode = 'SYSTEM_ERROR';
      message = error.message;
      actionType = 'retry';
    } else {
      errorCode = error.error || 'UNKNOWN_ERROR';
      message = error.message || 'An unexpected error occurred';
      actionType = error.action || 'retry';
      setupUrl = error.setup_url;
    }

    // Get user-friendly message and action based on error code
    const { userMessage, actionText, actionHandler } = getErrorDetails(
      errorCode, 
      message, 
      actionType, 
      setupUrl,
      { onRetry, onContactSupport }
    );

    if (showToast) {
      toast.error(userMessage, {
        action: actionHandler ? {
          label: actionText,
          onClick: actionHandler
        } : undefined,
        duration: 8000
      });
    }

    return {
      code: errorCode,
      message: userMessage,
      actionText,
      actionHandler,
      setupUrl
    };
  }, []);

  return { handleBillingError };
};

const getErrorDetails = (
  errorCode: string,
  message: string,
  actionType: string,
  setupUrl?: string,
  handlers?: { onRetry?: () => void; onContactSupport?: () => void }
) => {
  const { onRetry, onContactSupport } = handlers || {};

  switch (errorCode) {
    case 'AUTHENTICATION_FAILED':
      return {
        userMessage: 'Please log in again to access billing',
        actionText: 'Login',
        actionHandler: () => window.location.href = '/auth'
      };

    case 'CUSTOMER_CREATION_FAILED':
      return {
        userMessage: 'Unable to access billing portal. Try creating a subscription first.',
        actionText: 'View Plans',
        actionHandler: () => window.location.href = '/pricing'
      };

    case 'PORTAL_CONFIGURATION_REQUIRED':
      return {
        userMessage: 'Billing portal needs setup. Please contact support.',
        actionText: setupUrl ? 'Setup Guide' : 'Contact Support',
        actionHandler: setupUrl 
          ? () => window.open(setupUrl, '_blank')
          : onContactSupport || (() => window.open('mailto:support@viraltify.com', '_blank'))
      };

    case 'CONFIGURATION_ERROR':
      return {
        userMessage: 'Billing service temporarily unavailable. Please try again.',
        actionText: 'Retry',
        actionHandler: onRetry || (() => window.location.reload())
      };

    case 'PORTAL_ACCESS_FAILED':
      return {
        userMessage: 'Unable to access billing portal. Please try again or contact support.',
        actionText: 'Retry',
        actionHandler: onRetry
      };

    default:
      return {
        userMessage: message || 'An unexpected billing error occurred',
        actionText: actionType === 'contact_support' ? 'Contact Support' : 'Retry',
        actionHandler: actionType === 'contact_support' 
          ? onContactSupport || (() => window.open('mailto:support@viraltify.com', '_blank'))
          : onRetry
      };
  }
};