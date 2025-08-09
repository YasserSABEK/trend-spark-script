import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Filter, Heart, MessageCircle, Eye, TrendingUp, RefreshCw } from "lucide-react";
import { ReelCard } from "@/components/ReelCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { normalizeUsername } from "@/utils/username";

interface InstagramReel {
  id: string;
  post_id: string;
  url: string;
  caption: string;
  hashtags: string[];
  username: string;
  display_name: string;
  followers: number;
  verified: boolean;
  likes: number;
  comments: number;
  video_view_count: number;
  viral_score: number;
  engagement_rate: number;
  timestamp: string;
  scraped_at: string;
  thumbnail_url: string;
  video_url?: string;
}

export const ReelResults = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRetried, setHasRetried] = useState(false);

  useEffect(() => {
    if (username && !authLoading && session) {
      loadReels();
    }
  }, [username, authLoading, session]);

  const loadReels = async (isRetry = false) => {
    if (!username) return;
    
    try {
      setLoading(true);
      const normalizedUsername = normalizeUsername(username);
      
      console.log('🔍 Loading reels for username:', {
        original: username,
        normalized: normalizedUsername,
        userAuthenticated: !!user,
        isRetry
      });

      // Robust query that handles various username formats
      const { data, error } = await supabase
        .from('instagram_reels')
        .select('*')
        .or(`search_username.eq.${normalizedUsername},search_username.eq.${username},username.eq.${normalizedUsername},username.eq.${username}`)
        .order('viral_score', { ascending: false });

      if (error) throw error;

      console.log('📊 Reels query result:', {
        count: data?.length || 0,
        usernames: data?.slice(0, 3).map(r => ({ search_username: r.search_username, username: r.username }))
      });

      if (data && data.length > 0) {
        setReels(data);
      } else if (!isRetry && !hasRetried && user) {
        // One-time retry after auth is ready
        console.log('🔄 No reels found, retrying once...');
        setHasRetried(true);
        setTimeout(() => loadReels(true), 1000);
        return;
      } else {
        setReels([]);
      }
    } catch (error) {
      console.error('Error loading reels:', error);
      toast({
        title: "Error loading reels",
        description: "Failed to load reels from database",
        variant: "destructive",
      });
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  // Since search bar is removed, show all reels
  const filteredReels = reels;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/viral-reels')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Results for @{username}</h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${reels.length} reels found`}
            </p>
          </div>
        </div>

        {/* Search Bar - Removed as requested */}

        {/* Stats */}
        {!loading && reels.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber(reels.reduce((sum, reel) => sum + reel.likes, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber(reels.reduce((sum, reel) => sum + reel.comments, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Comments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(reels.reduce((sum, reel) => sum + reel.viral_score, 0) / reels.length)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Viral Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {reels.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Reels</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading reels...</p>
          </div>
        ) : reels.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No reels found</h3>
              <p className="text-muted-foreground mb-4">
                No reels found for @{username}. This might be because:
              </p>
              <ul className="text-sm text-muted-foreground mb-6 space-y-1">
                <li>• The username hasn't been searched yet</li>
                <li>• The search is still processing</li>
                <li>• No public reels were found for this account</li>
              </ul>
              <Button 
                onClick={() => loadReels()} 
                variant="outline" 
                className="mr-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button 
                onClick={() => navigate('/viral-reels')}
                variant="default"
              >
                Search New Username
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reels.map((reel) => (
              <ReelCard key={reel.id} reel={reel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};