import { cn } from '@/lib/utils';

interface DropIndicatorProps {
  isVisible: boolean;
  className?: string;
}

export function DropIndicator({ isVisible, className }: DropIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "h-0.5 bg-primary rounded-full transition-all duration-200 animate-pulse",
        "shadow-lg shadow-primary/50",
        isVisible ? "w-full opacity-100" : "w-0 opacity-0",
        className
      )}
    />
  );
}