import { Badge } from '@/components/ui/badge';
import { Clock, Coins } from 'lucide-react';

interface CostPreviewProps {
  cost: number;
  description?: string;
  cached?: boolean;
  lastUpdated?: string;
  className?: string;
}

export const CostPreview = ({ 
  cost, 
  description, 
  cached = false, 
  lastUpdated, 
  className = "" 
}: CostPreviewProps) => {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const updated = new Date(dateString);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (cached) {
    return (
      <Badge variant="secondary" className={`gap-1 ${className}`}>
        <Clock className="w-3 h-3" />
        Free (cached)
        {lastUpdated && (
          <span className="text-xs opacity-70">
            · Updated {formatTimeAgo(lastUpdated)}
          </span>
        )}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Coins className="w-3 h-3" />
      {cost} credit{cost !== 1 ? 's' : ''}
      {description && (
        <span className="text-xs opacity-70">· {description}</span>
      )}
    </Badge>
  );
};