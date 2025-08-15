import { useState, useEffect } from "react";
import { Search, Hash, TrendingUp, Users, Filter, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { CreditGuard } from "@/components/credits/CreditGuard";
import { TikTokVideoCard } from "@/components/TikTokVideoCard";
import { HashtagCard } from "@/components/HashtagCard";

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
  const { balance, hasCredits } = useCreditBalance();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [searches, setSearches] = useState<HashtagSearch[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<TikTokVideo[]>([]);
  const [activeTab, setActiveTab] = useState("search");
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("viral_score");
  const [minViralScore, setMinViralScore] = useState([30]);
  const [minViews, setMinViews] = useState([1000]);
  const [timeRange, setTimeRange] = useState("all");
  const [hashtagFilter, setHashtagFilter] = useState("all");
  const [visibleVideos, setVisibleVideos] = useState(8);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      loadHashtagVideos();
      loadSearchHistory();
    }
  }, [user]);

  useEffect(() => {
    // Apply all filters
    let filtered = videos;

    // Filter by selected hashtag
    if (selectedHashtag) {
      filtered = filtered.filter(video => 
        video.search_hashtag === selectedHashtag
      );
    }

    // Filter by hashtag dropdown
    if (hashtagFilter !== "all") {
      filtered = filtered.filter(video => 
        video.search_hashtag === hashtagFilter
      );
    }

    // Filter by viral score
    filtered = filtered.filter(video => 
      (video.viral_score || 0) >= minViralScore[0]
    );

    // Filter by views
    filtered = filtered.filter(video => 
      video.play_count >= minViews[0]
    );

    // Filter by time range
    if (timeRange !== "all") {
      filtered = filtered.filter(video => {
        if (!video.timestamp) return true;
        const now = new Date();
        const videoTime = new Date(video.timestamp);
        const diffInHours = (now.getTime() - videoTime.getTime()) / (1000 * 60 * 60);
        
        switch (timeRange) {
          case "24h":
            return diffInHours <= 24;
          case "week":
            return diffInHours <= 168;
          case "month":
            return diffInHours <= 720;
          default:
            return true;
        }
      });
    }

    // Sort videos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "viral_score":
          return (b.viral_score || 0) - (a.viral_score || 0);
        case "views":
          return b.play_count - a.play_count;
        case "likes":
          return b.digg_count - a.digg_count;
        case "date":
          return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredVideos(filtered);
  }, [videos, selectedHashtag, hashtagFilter, minViralScore, minViews, timeRange, sortBy]);

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
    
    // Create a pending search entry immediately for better UX
    const cleanHashtag = hashtag.replace('#', '');
    const tempSearchEntry: HashtagSearch = {
      id: `temp-${Date.now()}`,
      hashtag: cleanHashtag,
      status: 'pending',
      total_results: 0,
      requested_at: new Date().toISOString()
    };
    
    // Add temporary entry to show pending state
    setSearches(prev => [tempSearchEntry, ...prev]);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-tiktok-hashtags', {
        body: { hashtag: cleanHashtag }
      });

      if (error) {
        console.error('Function invoke error:', error);
        toast.error(`Network error: ${error.message}`);
        // Remove temporary entry on error
        setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
        return;
      }

      // Check if the response indicates success or failure
      if (data?.success === false) {
        console.error('Function returned error:', data);
        toast.error(data.error || "Failed to search hashtag - please try again");
        // Remove temporary entry on error
        setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
        return;
      }

      if (data?.success) {
        toast.success(`Found ${data.videosFound} TikTok videos for #${cleanHashtag}`);
        // Remove temporary entry and reload actual data
        setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
        await loadHashtagVideos();
        await loadSearchHistory();
      } else {
        console.error('Unexpected response format:', data);
        toast.error("Unexpected response from server - please try again");
        // Remove temporary entry on error
        setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
      }
    } catch (error) {
      console.error('Error during hashtag search:', error);
      toast.error("Network error occurred while searching hashtag");
      // Remove temporary entry on error
      setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
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

  const handleHashtagDeleted = () => {
    loadSearchHistory();
  };

  const clearFilters = () => {
    setSelectedHashtag(null);
    setHashtagFilter("all");
    setMinViralScore([30]);
    setMinViews([1000]);
    setTimeRange("all");
    setSortBy("viral_score");
  };

  const getUniqueHashtags = () => {
    const hashtags = videos.map(v => v.search_hashtag).filter(Boolean);
    return [...new Set(hashtags)];
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-6">
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
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {loading ? "Searching..." : "Search TikToks"}
                </Button>
              </CreditGuard>
            </form>
            {balance > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Available credits: {balance}
              </p>
            )}
          </CardContent>
        </Card>

        {/* My Hashtags Section */}
        {searches.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">My Hashtags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searches.map((search) => (
                <HashtagCard
                  key={search.id}
                  search={search}
                  onDelete={handleHashtagDeleted}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">My Hashtags</h3>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Hash className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hashtag searches yet</h3>
                <p className="text-muted-foreground text-center">
                  Search for a hashtag above to get started
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Section */}
        {selectedHashtag && (
          <div id="results-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  #{selectedHashtag} Videos
                </h3>
                <Badge variant="outline">{filteredVideos.length} videos</Badge>
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

            {/* Advanced Filters */}
            {showFilters && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sort by</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viral_score">Viral Score</SelectItem>
                          <SelectItem value="views">Views</SelectItem>
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

            {/* Videos Grid */}
            {filteredVideos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No videos found</h3>
                  <p className="text-muted-foreground text-center">
                    Try adjusting your filters or search for a different hashtag
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.slice(0, visibleVideos).map((video) => (
                  <TikTokVideoCard
                    key={video.id}
                    video={video}
                    onGenerateScript={handleGenerateScript}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {filteredVideos.length > visibleVideos && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setVisibleVideos(prev => prev + 8)}
                  className="flex items-center gap-2"
                >
                  Load More Videos
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}