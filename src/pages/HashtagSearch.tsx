import { useState, useEffect } from "react";
import { Search, Hash, TrendingUp, Clock, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { CreditGuard } from "@/components/credits/CreditGuard";
import { TikTokVideoCard } from "@/components/TikTokVideoCard";

interface HashtagSearch {
  id: string;
  hashtag: string;
  status: string;
  total_results: number;
  requested_at: string;
  completed_at?: string;
}

interface TikTokVideo {
  id: string;
  post_id: string;
  url: string;
  web_video_url?: string;
  caption?: string;
  hashtags?: string[];
  digg_count: number; // likes in TikTok
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
  search_hashtag?: string;
  scraped_at?: string;
  platform: string;
}

export function HashtagSearch() {
  const { user } = useAuth();
  const { credits, hasCredits } = useCredits();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [searches, setSearches] = useState<HashtagSearch[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<TikTokVideo[]>([]);

  useEffect(() => {
    if (user) {
      loadHashtagVideos();
      loadSearchHistory();
    }
  }, [user]);

  useEffect(() => {
    // Filter videos based on search term
    if (searchTerm.trim()) {
      const filtered = videos.filter(video =>
        video.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.hashtags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredVideos(filtered);
    } else {
      setFilteredVideos(videos);
    }
  }, [videos, searchTerm]);

  const scrapeHashtagPosts = async (hashtag: string) => {
    if (!user) {
      toast.error("Please sign in to search hashtags");
      return;
    }

    if (!hasCredits(2)) {
      toast.error("Insufficient credits. You need 2 credits for hashtag search.");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-tiktok-hashtags', {
        body: { hashtag: hashtag.replace('#', '') }
      });

      if (error) {
        console.error('Hashtag scraping error:', error);
        toast.error(error.message || "Failed to search hashtag");
        return;
      }

      if (data?.success) {
        toast.success(`Found ${data.videosFound} TikTok videos for #${hashtag}`);
        await loadHashtagVideos();
        await loadSearchHistory();
      } else {
        toast.error(data?.error || "Failed to search hashtag");
      }
    } catch (error) {
      console.error('Error during hashtag search:', error);
      toast.error("An error occurred while searching the hashtag");
    } finally {
      setLoading(false);
    }
  };

  const loadHashtagVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('tiktok_videos')
        .select('*')
        .not('search_hashtag', 'is', null)
        .order('viral_score', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading TikTok videos:', error);
        return;
      }

      setVideos(data || []);
    } catch (error) {
      console.error('Error loading TikTok videos:', error);
    }
  };

  const loadSearchHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('search_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('search_type', 'hashtag')
        .eq('platform', 'tiktok')
        .order('requested_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading search history:', error);
        return;
      }

      setSearches(data || []);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      scrapeHashtagPosts(searchTerm.trim());
    }
  };

  const repeatSearch = (hashtag: string) => {
    setSearchTerm(hashtag);
    scrapeHashtagPosts(hashtag);
  };

  const handleGenerateScript = async (result: any) => {
    toast.success("Script generated successfully!");
    // Navigation will be handled by the ReelCard component
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} weeks ago`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">TikTok Hashtag Search</h1>
          <p className="text-muted-foreground">
            Discover viral TikTok videos from popular hashtags in the last year
          </p>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Search TikTok Hashtags
            </CardTitle>
            <CardDescription>
              Search for viral TikTok videos by hashtag (2 credits per search)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Enter hashtag (e.g., makemoneyonline, fitness, travel)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <CreditGuard requiredCredits={2} action="hashtag search">
                <Button 
                  type="submit" 
                  disabled={loading || !searchTerm.trim()}
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {loading ? "Searching..." : "Search TikToks"}
                </Button>
              </CreditGuard>
            </form>
            {credits && (
              <p className="text-sm text-muted-foreground mt-2">
                Available credits: {credits.current_credits}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Searches */}
        {searches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Hashtag Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {searches.map((search) => (
                  <Badge
                    key={search.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                    onClick={() => repeatSearch(search.hashtag)}
                  >
                    <Hash className="w-3 h-3" />
                    {search.hashtag}
                    {search.total_results > 0 && (
                      <span className="text-xs">({search.total_results})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        {filteredVideos.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{filteredVideos.length} viral TikToks found</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>From {new Set(filteredVideos.map(v => v.username)).size} creators</span>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <TikTokVideoCard
                key={video.id}
                video={video}
                onGenerateScript={handleGenerateScript}
              />
            ))}
          </div>
        ) : !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Hash className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No TikTok videos yet</h3>
              <p className="text-muted-foreground text-center">
                Search for a hashtag to discover viral TikTok content
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}