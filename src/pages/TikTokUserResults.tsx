import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, TrendingUp, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { TikTokVideoCard } from "@/components/TikTokVideoCard";
import { normalizeUsername } from "@/utils/username";

interface TikTokVideo {
  id: string;
  post_id: string;
  url: string;
  web_video_url?: string;
  caption?: string;
  hashtags?: string[];
  digg_count: number;
  share_count: number;
  play_count: number;
  comment_count: number;
  collect_count: number;
  viral_score?: number;
  engagement_rate?: number;
  timestamp?: string;
  username?: string;
  display_name?: string;
  author_avatar?: string;
  verified?: boolean;
  followers?: number;
  video_duration?: number;
  music_name?: string;
  music_author?: string;
  music_original?: boolean;
  scraped_at?: string;
  platform: string;
}

export const TikTokUserResults = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRetried, setHasRetried] = useState(false);

  useEffect(() => {
    // Check if videos were passed via navigation state (from search)
    if (location.state?.videos && Array.isArray(location.state.videos)) {
      console.log('Videos received from navigation state:', location.state.videos.length);
      setVideos(location.state.videos);
      setLoading(false);
    } else if (username && !authLoading && session) {
      console.log('No videos in navigation state, trying to load from database for:', username);
      loadVideos();
    }
  }, [username, authLoading, session, location.state]);

  const loadVideos = async (isRetry = false) => {
    if (!username) return;

    try {
      setLoading(true);
      const normalized = normalizeUsername(username);

      // Try to fetch from database first (for previously searched usernames)
      const { data, error } = await supabase
        .from('tiktok_videos')
        .select('*')
        .or(`username.eq.${normalized},username.eq.${username}`)
        .order('viral_score', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setVideos(data as any);
      } else {
        // No data found in database - user needs to go back and search
        setVideos([]);
      }
    } catch (err) {
      console.error('Error loading TikTok videos:', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => navigate('/viral-tiktoks')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Results for @{username}</h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${videos.length} videos found`}
            </p>
          </div>
        </div>

        {/* Stats */}
        {!loading && videos.length > 0 && (
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
                    {formatNumber(videos.reduce((sum, v) => sum + (v.digg_count || 0), 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber(videos.reduce((sum, v) => sum + (v.comment_count || 0), 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Comments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber(videos.reduce((sum, v) => sum + (v.play_count || 0), 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(videos.reduce((sum, v) => sum + (v.viral_score || 0), 0) / videos.length)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Viral Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No videos found</h3>
              <p className="text-muted-foreground mb-4">
                No videos found for @{username}. This might be because:
              </p>
              <ul className="text-sm text-muted-foreground mb-6 space-y-1">
                <li>• You need to search for this username first</li>
                <li>• The search didn't find any recent videos</li>
                <li>• The username might be private or restricted</li>
              </ul>
              <Button 
                onClick={() => loadVideos()} 
                variant="outline" 
                className="mr-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button 
                onClick={() => navigate('/viral-tiktoks')}
                variant="default"
              >
                Search New Username
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <TikTokVideoCard key={video.id} video={video as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TikTokUserResults;
