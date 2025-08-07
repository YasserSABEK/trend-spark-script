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
import { ReelCard } from "@/components/ReelCard";

interface HashtagSearch {
  id: string;
  hashtag: string;
  status: string;
  total_results: number;
  requested_at: string;
  completed_at?: string;
}

interface InstagramReel {
  id: string;
  post_id: string;
  url: string;
  caption: string;
  likes: number;
  comments: number;
  video_view_count: number;
  viral_score: number;
  engagement_rate: number;
  timestamp: string;
  thumbnail_url: string;
  username: string;
  display_name: string;
  followers: number;
  verified: boolean;
  hashtags: string[];
  video_url?: string;
  scraped_at: string;
}

export function HashtagSearch() {
  const { user } = useAuth();
  const { credits, hasCredits } = useCredits();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [searches, setSearches] = useState<HashtagSearch[]>([]);
  const [filteredReels, setFilteredReels] = useState<InstagramReel[]>([]);

  useEffect(() => {
    if (user) {
      loadHashtagReels();
      loadSearchHistory();
    }
  }, [user]);

  useEffect(() => {
    // Filter reels based on search term
    if (searchTerm.trim()) {
      const filtered = reels.filter(reel =>
        reel.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reel.hashtags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredReels(filtered);
    } else {
      setFilteredReels(reels);
    }
  }, [reels, searchTerm]);

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
      const { data, error } = await supabase.functions.invoke('scrape-instagram-hashtags', {
        body: { hashtag: hashtag.replace('#', '') }
      });

      if (error) {
        console.error('Hashtag scraping error:', error);
        toast.error(error.message || "Failed to search hashtag");
        return;
      }

      if (data?.success) {
        toast.success(`Found ${data.totalPosts} posts for #${data.hashtag}`);
        await loadHashtagReels();
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

  const loadHashtagReels = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_reels')
        .select('*')
        .not('search_hashtag', 'is', null)
        .order('viral_score', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading hashtag reels:', error);
        return;
      }

      setReels(data || []);
    } catch (error) {
      console.error('Error loading hashtag reels:', error);
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
          <h1 className="text-3xl font-bold text-foreground">Hashtag Search</h1>
          <p className="text-muted-foreground">
            Discover trending posts from popular hashtags in the last year
          </p>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Search Hashtag Posts
            </CardTitle>
            <CardDescription>
              Search for viral content by hashtag (2 credits per search)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Enter hashtag (e.g., fashion, fitness, travel)"
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
                  {loading ? "Searching..." : "Search Posts"}
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
        {filteredReels.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{filteredReels.length} viral posts found</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>From {new Set(filteredReels.map(r => r.username)).size} creators</span>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {filteredReels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReels.map((reel) => (
              <ReelCard
                key={reel.id}
                reel={reel}
                onGenerateScript={handleGenerateScript}
              />
            ))}
          </div>
        ) : !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Hash className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hashtag posts yet</h3>
              <p className="text-muted-foreground text-center">
                Search for a hashtag to discover trending posts and viral content
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}