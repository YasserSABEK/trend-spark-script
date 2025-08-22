import { Users, Clock, TrendingUp, AlertCircle, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstallationProgress } from './InstallationProgress';
import { CreatorProfileAvatar } from '@/components/profile/CreatorProfileAvatar';

interface CreatorSearch {
  id: string;
  query: string;
  status: string;
  requested_at: string;
  total_results: number;
  processing_time_seconds: number;
  completed_at?: string;
  error_message?: string;
  profile_photo_url?: string | object;
}

interface CreatorSearchCardProps {
  search: CreatorSearch;
  onViewResults: () => void;
  onDelete: () => void;
}

export const CreatorSearchCard = ({ search, onViewResults, onDelete }: CreatorSearchCardProps) => {
  const getStatusIcon = () => {
    switch (search.status) {
      case 'queued':
        return <Clock className="w-3 h-3" />;
      case 'running':
        return <TrendingUp className="w-3 h-3 animate-pulse" />;
      case 'completed':
        return <Play className="w-3 h-3" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusBadge = () => {
    const icon = getStatusIcon();
    
    switch (search.status) {
      case 'queued':
        return (
          <Badge variant="secondary" className="gap-1">
            {icon}
            Queued
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="secondary" className="gap-1">
            {icon}
            Running
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
            {icon}
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            {icon}
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            {icon}
            Unknown
          </Badge>
        );
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getCreatorCountText = () => {
    if (search.status === 'completed') {
      return `${search.total_results} creators`;
    }
    return '— creators';
  };

  const isViewEnabled = search.status === 'completed' && search.total_results > 0;

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/30 transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6">
        {/* Header with avatar */}
        <div className="flex items-start justify-between mb-4">
          <CreatorProfileAvatar 
            profilePhotoUrl={search.profile_photo_url}
            creatorName={search.query}
            size="default"
          />
          {getStatusBadge()}
        </div>

        {/* Title and meta */}
        <div className="space-y-2 mb-4">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {search.query}
          </h3>
          <div className="text-sm text-muted-foreground">
            {formatTimeAgo(search.requested_at)} • {getCreatorCountText()}
          </div>
        </div>

        {/* Error message if failed */}
        {search.status === 'failed' && search.error_message && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{search.error_message}</p>
          </div>
        )}

        {/* Installation Progress or Footer actions */}
        {search.status === 'running' || search.status === 'queued' ? (
          <div className="space-y-3">
            <InstallationProgress
              status={search.status as 'running' | 'queued'}
              startTime={search.requested_at}
              icon={<Users className="w-4 h-4 text-primary" />}
              title={`Creators: ${search.query}`}
              className="w-full"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="w-full text-muted-foreground hover:text-destructive"
            >
              Cancel & Delete
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewResults}
              disabled={!isViewEnabled}
              className="flex-1 mr-2"
            >
              {search.status === 'failed' ? 'Retry' : 'View Creators'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};