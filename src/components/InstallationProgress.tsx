import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface InstallationProgressProps {
  status: 'pending' | 'processing' | 'running' | 'queued' | 'completed' | 'failed';
  startTime?: string;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  searchId?: string; // For progress persistence
}

export const InstallationProgress = ({ 
  status, 
  startTime, 
  className = "",
  icon,
  title = "Searching",
  searchId
}: InstallationProgressProps) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("Initializing...");

  const isProcessing = status === 'processing' || status === 'running' || status === 'queued';
  const storageKey = searchId ? `search_progress_${searchId}` : null;

  useEffect(() => {
    if (!isProcessing) {
      if (status === 'completed') {
        setProgress(100);
        setPhase("Search complete");
        // Clear stored progress on completion
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
      } else if (status === 'failed') {
        setPhase("Search failed");
        // Clear stored progress on failure
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
      }
      return;
    }

    // Try to restore progress from localStorage
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const { progress: storedProgress, phase: storedPhase } = JSON.parse(stored);
          setProgress(storedProgress);
          setPhase(storedPhase);
          console.log('Restored progress:', storedProgress, storedPhase);
          return; // Don't reset if we restored state
        } catch (e) {
          console.error('Failed to restore progress:', e);
        }
      }
    }

    // Reset progress when starting
    setProgress(5);
    setPhase("Initializing search...");

    const phases = [
      { text: "Connecting to data sources...", duration: 8000, targetProgress: 15 },
      { text: "Fetching creator data...", duration: 12000, targetProgress: 35 },
      { text: "Analyzing creator profiles...", duration: 20000, targetProgress: 65 },
      { text: "Processing search results...", duration: 12000, targetProgress: 85 },
      { text: "Finalizing search...", duration: 8000, targetProgress: 95 },
    ];

    let currentPhaseIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const runPhase = () => {
      if (currentPhaseIndex >= phases.length) return;

      const currentPhase = phases[currentPhaseIndex];
      setPhase(currentPhase.text);

      // Smooth progress animation
      const startProgress = progress;
      const targetProgress = currentPhase.targetProgress;
      const duration = currentPhase.duration;
      const steps = 60; // 60fps animation
      const stepDuration = duration / steps;
      const progressStep = (targetProgress - startProgress) / steps;

      let step = 0;
      const progressInterval = setInterval(() => {
        step++;
        const newProgress = Math.min(startProgress + (progressStep * step), targetProgress);
        setProgress(newProgress);

        // Store progress if we have a searchId
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify({
            progress: newProgress,
            phase: currentPhase.text
          }));
        }

        if (step >= steps) {
          clearInterval(progressInterval);
          currentPhaseIndex++;
          
          if (currentPhaseIndex < phases.length) {
            timeoutId = setTimeout(runPhase, 500);
          }
        }
      }, stepDuration);
    };

    // Start the first phase after a short delay
    timeoutId = setTimeout(runPhase, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isProcessing, status]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          badge: <Badge className="bg-green-500 hover:bg-green-600">Complete</Badge>,
          showProgress: false
        };
      case 'failed':
        return {
          icon: <AlertCircle className="w-4 h-4 text-destructive" />,
          badge: <Badge variant="destructive">Failed</Badge>,
          showProgress: false
        };
      default:
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin text-primary" />,
          badge: <Badge variant="secondary" className="bg-primary/10 text-primary">Searching</Badge>,
          showProgress: true
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const elapsedTime = startTime ? Math.floor((Date.now() - new Date(startTime).getTime()) / 1000) : 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with icon and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="relative">
              {icon}
              {isProcessing && (
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20" />
              )}
            </div>
          )}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {statusDisplay.badge}
      </div>

      {/* Progress bar with gradient */}
      {statusDisplay.showProgress && (
        <div className="space-y-2">
          <Progress 
            value={progress} 
            className="h-2 bg-secondary/50"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{phase}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          {elapsedTime > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              {elapsedTime}s elapsed
            </div>
          )}
        </div>
      )}

      {/* Completion message */}
      {status === 'completed' && (
        <div className="text-xs text-green-600 text-center animate-fade-in">
          ✓ Search completed successfully
        </div>
      )}

      {/* Error message */}
      {status === 'failed' && (
        <div className="text-xs text-destructive text-center animate-fade-in">
          ✗ Search failed - please try again
        </div>
      )}
    </div>
  );
};