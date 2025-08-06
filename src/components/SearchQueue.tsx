import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, AlertCircle, Loader2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchQueueItem {
  id: string;
  username: string;
  status: string;
  requested_at: string;
  completed_at?: string;
  total_results: number;
  processing_time_seconds: number;
  error_message?: string;
}

interface SearchQueueProps {
  onViewResults: (username: string) => void;
  triggerRefresh: number;
}

export const SearchQueue = ({ onViewResults, triggerRefresh }: SearchQueueProps) => {
  const [searches, setSearches] = useState<SearchQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSearchQueue();
  }, [triggerRefresh]);

  const loadSearchQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('search_queue')
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSearches(data || []);
    } catch (error) {
      console.error('Error loading search queue:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (searches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No searches yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Searches</h3>
        <div className="space-y-4">
          {searches.map((search) => (
            <div key={search.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    @{search.username.slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">@{search.username}</p>
                    {getStatusIcon(search.status)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{formatTimeAgo(search.requested_at)}</span>
                    {search.total_results > 0 && (
                      <span>{search.total_results} reels</span>
                    )}
                    {search.processing_time_seconds > 0 && (
                      <span>{search.processing_time_seconds}s</span>
                    )}
                  </div>
                  {search.status === 'processing' && (
                    <Progress value={65} className="w-full mt-2 h-1" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(search.status)}
                {search.status === 'completed' && search.total_results > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewResults(search.username)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    View Results
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};