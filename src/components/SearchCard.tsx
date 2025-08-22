
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Loader2, Play, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { normalizeUsername } from "@/utils/username";
import { ProgressWithLabel } from "@/components/ui/progress-with-label";
import { useState, useEffect } from "react";

interface SearchQueueItem {
  id: string;
  username?: string;
  hashtag?: string;
  search_type?: string;
  platform?: string;
  status: string;
  requested_at: string;
  completed_at?: string;
  total_results: number;
  processing_time_seconds: number;
  error_message?: string;
}

interface SearchCardProps {
  search: SearchQueueItem;
  onViewResults: (username: string) => void;
  onDelete: () => void;
}

export const SearchCard = ({ search, onViewResults, onDelete }: SearchCardProps) => {
  const { toast } = useToast();
  
  // Progress state for processing animation
  const [estimatedProgress, setEstimatedProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Analyzing reel...");
  
  const progressMessages = [
    "Analyzing reel...",
    "Scraping data...", 
    "Processing content...",
    "Extracting metadata...",
    "Almost done..."
  ];

  // Determine if this is a hashtag or username search
  const isHashtagSearch = search.search_type === 'hashtag' || (search.hashtag && !search.username);
  const displayText = isHashtagSearch ? (search.hashtag || 'Unknown') : (search.username || 'Unknown');
  const displayInitials = isHashtagSearch ? '#' : displayText.slice(0, 2);

  // Simulate progress for processing state
  useEffect(() => {
    if (search.status === 'processing') {
      setEstimatedProgress(0);
      setProgressMessage(progressMessages[0]);
      
      const totalDuration = 45000; // 45 seconds
      const interval = 200; // Update every 200ms
      const increment = 100 / (totalDuration / interval);
      
      const progressInterval = setInterval(() => {
        setEstimatedProgress(prev => {
          const newProgress = Math.min(prev + increment, 95); // Cap at 95% until completion
          return newProgress;
        });
      }, interval);
      
      // Rotate messages every 9 seconds
      const messageInterval = setInterval(() => {
        setProgressMessage(prev => {
          const currentIndex = progressMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % progressMessages.length;
          return progressMessages[nextIndex];
        });
      }, 9000);
      
      return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
      };
    } else if (search.status === 'completed') {
      // Animate to 100% on completion
      setEstimatedProgress(100);
    }
  }, [search.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-instagram-orange" />;
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
    console.log('Delete button clicked for search:', search.id);
    try {
      console.log('Attempting to delete search with ID:', search.id);
      const { error } = await supabase
        .from('search_queue')
        .delete()
        .eq('id', search.id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Search deleted successfully');
      toast({
        title: "Search deleted",
        description: `Removed search for ${isHashtagSearch ? `#${displayText}` : `@${displayText}`}`,
      });
      
      onDelete();
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
      {/* Header with avatar-like design */}
      <div className="aspect-[4/3] bg-gradient-to-br from-instagram-pink/20 via-instagram-purple/20 to-instagram-orange/20 flex items-center justify-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center">
          <span className="text-white font-bold text-xl">
            {isHashtagSearch ? '#' : displayInitials.toUpperCase()}
          </span>
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
              console.log('Delete button clicked - stopping propagation');
              e.stopPropagation();
              handleDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Username/Hashtag and status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">
              {isHashtagSearch ? `#${displayText}` : `@${displayText}`}
            </p>
          </div>
          {getStatusBadge(search.status)}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span>{formatTimeAgo(search.requested_at)}</span>
          {search.status === 'completed' && (
            <span>{search.total_results} videos</span>
          )}
          {search.processing_time_seconds > 0 && (
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
        {search.status === 'completed' && search.total_results >= 0 && (search.username || search.hashtag) ? (
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-instagram-pink to-instagram-purple hover:opacity-90"
            onClick={(e) => {
              e.stopPropagation();
              if (isHashtagSearch) {
                // For hashtag searches, navigate to hashtag videos page
                window.location.href = `/hashtag-videos?hashtag=${search.hashtag}`;
              } else {
                onViewResults(normalizeUsername(search.username!));
              }
            }}
          >
            <Play className="w-4 h-4 mr-2" />
            {search.total_results === 0 ? 
              `No videos found` : 
              `View ${search.total_results} videos`
            }
          </Button>
        ) : search.status === 'processing' ? (
          <div className="space-y-2">
            <ProgressWithLabel
              value={estimatedProgress}
              label={progressMessage}
              variant="instagram"
              height="sm"
              className="h-1.5"
            />
          </div>
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
