import { useState, useEffect } from "react";
import { Search, Hash, TrendingUp, Filter, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { CreditGuard } from "@/components/credits/CreditGuard";
import { TikTokVideoCard } from "@/components/TikTokVideoCard";
import { HashtagCard } from "@/components/HashtagCard";
import { ReelCard } from "@/components/ReelCard";

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
  search_hashtag?: string;
  scraped_at?: string;
  platform: string;
}

interface InstagramReel {
  id: string;
  post_id: string;
  url: string;
  caption?: string;
  hashtags?: string[];
  username?: string;
  display_name?: string;
  followers?: number;
  verified?: boolean;
  likes: number;
  comments: number;
  video_view_count: number;
  video_play_count: number;
  viral_score?: number;
  engagement_rate?: number;
  timestamp?: string;
  thumbnail_url?: string;
  video_url?: string;
  video_duration?: number;
  search_hashtag?: string;
  user_id?: string;
}

export function HashtagSearch() {
  const { user } = useAuth();
  const { credits, hasCredits } = useCredits();
  const [platform, setPlatform] = useState<'tiktok' | 'instagram'>('instagram');
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [searches, setSearches] = useState<HashtagSearch[]>([]);
  const [filteredResults, setFilteredResults] = useState<(TikTokVideo | InstagramReel)[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("views");
  const [minViralScore, setMinViralScore] = useState([30]);
  const [minViews, setMinViews] = useState([1000]);
  const [timeRange, setTimeRange] = useState("all");
  const [visibleCount, setVisibleCount] = useState(24);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (platform === 'tiktok') {
        loadHashtagVideos();
      } else {
        loadInstagramReels();
      }
      loadSearchHistory();
    }
  }, [user, platform]);

  useEffect(() => {
    applyFilters();
  }, [platform, videos, reels, selectedHashtag, minViralScore, minViews, timeRange, sortBy]);

  const applyFilters = () => {
    const dataSource = platform === 'tiktok' ? videos : reels;
    
    let filtered = dataSource.filter((item: any) => {
      if (selectedHashtag && item.search_hashtag !== selectedHashtag) return false;
      if ((item.viral_score || 0) < minViralScore[0]) return false;
      
      const views = platform === 'tiktok' ? item.play_count : item.video_view_count;
      if (views < minViews[0]) return false;
      
      if (timeRange !== "all" && item.timestamp) {
        const now = new Date();
        const itemTime = new Date(item.timestamp);
        const diffInHours = (now.getTime() - itemTime.getTime()) / (1000 * 60 * 60);
        
        switch (timeRange) {
          case "24h":
            if (diffInHours > 24) return false;
            break;
          case "week":
            if (diffInHours > 168) return false;
            break;
          case "month":
            if (diffInHours > 720) return false;
            break;
        }
      }
      
      return true;
    });

    // Sort results
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "viral_score":
          return (b.viral_score || 0) - (a.viral_score || 0);
        case "views":
          const aViews = platform === 'tiktok' ? a.play_count : a.video_view_count;
          const bViews = platform === 'tiktok' ? b.play_count : b.video_view_count;
          return bViews - aViews;
        case "likes":
          const aLikes = platform === 'tiktok' ? a.digg_count : a.likes;
          const bLikes = platform === 'tiktok' ? b.digg_count : b.likes;
          return bLikes - aLikes;
        case "date":
          return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredResults(filtered);
  };

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
    setError(null);
    const cleanHashtag = hashtag.replace('#', '');
    setSelectedHashtag(cleanHashtag);

    try {
      const functionName = platform === 'tiktok' ? 'scrape-tiktok-hashtags' : 'scrape-instagram-hashtags';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { hashtag: cleanHashtag },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw new Error(error.message);

      if (data?.success) {
        const count = platform === 'tiktok' ? data.videosFound : data.totalPosts;
        toast.success(`Found ${count} ${platform === 'tiktok' ? 'TikTok videos' : 'Instagram reels'} for #${cleanHashtag}`);
        
        // Reload data after successful scrape
        if (platform === 'tiktok') {
          await loadHashtagVideos();
        } else {
          await loadInstagramReels();
        }
        await loadSearchHistory();
      } else {
        throw new Error(data?.error || 'Failed to search hashtag');
      }
    } catch (err: any) {
      console.error('Error during hashtag search:', err);
      setError(err.message || "Network error occurred while searching hashtag");
      toast.error(err.message || "Network error occurred while searching hashtag");
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
        .order('play_count', { ascending: false })
        .limit(200);
        
      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading TikTok videos:', error);
    }
  };

  const loadInstagramReels = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_reels')
        .select('*')
        .not('search_hashtag', 'is', null)
        .order('video_view_count', { ascending: false })
        .limit(200);
        
      if (error) throw error;
      setReels(data || []);
    } catch (error) {
      console.error('Error loading Instagram reels:', error);
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
        .eq('platform', platform)
        .order('requested_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
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

  const clearFilters = () => {
    setSelectedHashtag(null);
    setMinViralScore([30]);
    setMinViews([1000]);
    setTimeRange("all");
    setSortBy("views");
    setVisibleCount(24);
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + 24);
  };

  const handleGenerateScript = async (result: any) => {
    toast.success("Script generated successfully!");
  };

  const handleHashtagDeleted = () => {
    loadSearchHistory();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="w-full aspect-[9/16]" />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-8" />
              ))}
            </div>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No reels found</h3>
        <p className="text-muted-foreground text-center">
          Try a different hashtag or adjust your filters
        </p>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-red-500 mb-4">⚠️</div>
        <h3 className="text-lg font-semibold mb-2">Search Error</h3>
        <p className="text-muted-foreground text-center mb-4">{error}</p>
        <Button onClick={() => setError(null)} variant="outline">
          Try Again
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            {platform === 'tiktok' ? 'Search TikTok Hashtags' : 'Search Instagram Hashtags'}
          </CardTitle>
          <CardDescription>
            {platform === 'tiktok'
              ? 'Search for viral TikTok videos by hashtag (2 credits per search)'
              : 'Search for viral Instagram reels by hashtag (2 credits per search)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <Select value={platform} onValueChange={(val) => setPlatform(val as 'tiktok' | 'instagram')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder={`Enter hashtag (e.g., ${platform === 'tiktok' ? 'makemoneyonline, fitness' : 'travel, beauty'})`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <CreditGuard requiredCredits={2} action="hashtag search">
              <Button 
                type="submit" 
                disabled={loading || !searchTerm.trim()}
                className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 whitespace-nowrap"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                {loading ? "Searching..." : `Search ${platform === 'tiktok' ? 'TikToks' : 'Reels'}`}
              </Button>
            </CreditGuard>
          </form>
          
          {credits && (
            <p className="text-sm text-muted-foreground mt-3">
              Available credits: {credits.current_credits}
            </p>
          )}
        </CardContent>
      </Card>

      {/* My Hashtags Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">My Hashtags</h3>
        {searches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searches.map((search) => (
              <HashtagCard
                key={search.id}
                search={search}
                onDelete={handleHashtagDeleted}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Hash className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hashtag searches yet</h3>
              <p className="text-muted-foreground text-center">
                Search for a hashtag above to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Section */}
      {selectedHashtag && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                #{selectedHashtag} {platform === 'tiktok' ? 'Videos' : 'Reels'}
              </h3>
              <Badge variant="outline">
                {filteredResults.length} {platform === 'tiktok' ? 'videos' : 'reels'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort by</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="views">Views</SelectItem>
                        <SelectItem value="viral_score">Viral Score</SelectItem>
                        <SelectItem value="likes">Likes</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time Range</label>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Min Viral Score: {minViralScore[0]}
                    </label>
                    <Slider
                      value={minViralScore}
                      onValueChange={setMinViralScore}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Min Views: {formatNumber(minViews[0])}
                    </label>
                    <Slider
                      value={minViews}
                      onValueChange={setMinViews}
                      max={10000000}
                      min={1000}
                      step={1000}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Grid */}
          {loading ? (
            renderSkeletons()
          ) : error ? (
            renderErrorState()
          ) : filteredResults.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredResults.slice(0, visibleCount).map((item: any) => 
                  platform === 'tiktok' ? (
                    <TikTokVideoCard
                      key={item.id}
                      video={item}
                      onGenerateScript={handleGenerateScript}
                    />
                  ) : (
                    <ReelCard
                      key={item.id}
                      reel={item}
                      onGenerateScript={handleGenerateScript}
                    />
                  )
                )}
              </div>

              {/* Load More Button */}
              {filteredResults.length > visibleCount && (
                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="flex items-center gap-2"
                  >
                    Load More {platform === 'tiktok' ? 'Videos' : 'Reels'}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}