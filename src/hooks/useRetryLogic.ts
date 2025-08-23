import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (attempt: number) => void;
  onFinalError?: (error: any) => void;
}

export const useRetryLogic = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T | null> => {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      onRetry,
      onFinalError
    } = options;

    setIsRetrying(false);
    setRetryCount(0);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          setIsRetrying(true);
          setRetryCount(attempt + 1);
          
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          
          if (onRetry) {
            onRetry(attempt + 1);
          } else if (attempt === 0) {
            toast.error(`Operation failed - retrying automatically...`);
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          setIsRetrying(false);
          setRetryCount(0);
          
          if (onFinalError) {
            onFinalError(error);
          } else {
            toast.error(`Operation failed after ${maxRetries + 1} attempts`);
          }
          
          return null;
        }
      }
    }
    
    return null;
  }, []);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
  }, []);

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    reset
  };
};