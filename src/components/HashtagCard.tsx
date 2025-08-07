import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Loader2, Play, Trash2, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HashtagSearch {
  id: string;
  hashtag: string;
  status: string;
  requested_at: string;
  completed_at?: string;
  total_results: number;
  processing_time_seconds?: number;
  error_message?: string;
}

interface HashtagCardProps {
  search: HashtagSearch;
  onViewResults: (hashtag: string) => void;
  onDelete: () => void;
}

export const HashtagCard = ({ search, onViewResults, onDelete }: HashtagCardProps) => {
  const { toast } = useToast();

  const displayHashtag = search.hashtag || 'Unknown';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      processing: "secondary", 
      completed: "default",
      failed: "destructive"
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('search_queue')
        .delete()
        .eq('id', search.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Hashtag search deleted",
        description: `Removed search for #${displayHashtag}`,
      });
      
      onDelete();
    } catch (error) {
      console.error('Error deleting hashtag search:', error);
      toast({
        title: "Error",
        description: "Failed to delete hashtag search",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
      {/* Header with TikTok-style design */}
      <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 via-primary/30 to-primary/20 flex items-center justify-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
          <Hash className="text-primary-foreground w-8 h-8" />
        </div>
        
        {/* Status icon overlay */}
        <div className="absolute top-3 right-3">
          {getStatusIcon(search.status)}
        </div>

        {/* Delete button */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="destructive"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Hashtag and status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">#{displayHashtag}</p>
          </div>
          {getStatusBadge(search.status)}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span>{formatTimeAgo(search.requested_at)}</span>
          {search.total_results > 0 && (
            <span>{search.total_results} videos</span>
          )}
          {search.processing_time_seconds && search.processing_time_seconds > 0 && (
            <span>{search.processing_time_seconds}s</span>
          )}
        </div>

        {/* Error message */}
        {search.status === 'failed' && search.error_message && (
          <p className="text-xs text-destructive mb-3 line-clamp-2">
            {search.error_message}
          </p>
        )}

        {/* Action button */}
        {search.status === 'completed' && search.total_results > 0 ? (
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            onClick={(e) => {
              e.stopPropagation();
              onViewResults(search.hashtag);
            }}
          >
            <Play className="w-4 h-4 mr-2" />
            View {search.total_results} Videos
          </Button>
        ) : search.status === 'processing' ? (
          <Button size="sm" className="w-full" disabled>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </Button>
        ) : search.status === 'failed' ? (
          <Button size="sm" variant="outline" className="w-full" disabled>
            <AlertCircle className="w-4 h-4 mr-2" />
            Failed
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="w-full" disabled>
            <Clock className="w-4 h-4 mr-2" />
            Pending
          </Button>
        )}
      </CardContent>
    </Card>
  );
};