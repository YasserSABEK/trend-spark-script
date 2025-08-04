import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Heart, 
  MessageSquare, 
  Share, 
  Play, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Zap,
  User,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

export const ViralReels = () => {
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [visibleReels, setVisibleReels] = useState(6);
  const [filterOptions, setFilterOptions] = useState({
    minViralScore: 50,
    minLikes: 1000,
    timeRange: '24h'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadViralReels();
  }, []);

  const scrapeInstagramUser = async () => {
    if (!instagramUsername.trim()) {
      toast({
        title: "Username required",
        description: "Please enter an Instagram username",
        variant: "destructive",
      });
      return;
    }

    try {
      setScrapingLoading(true);
      
      const { data, error } = await supabase.functions.invoke('scrape-instagram', {
        body: { username: instagramUsername.trim() }
      });

      if (error) throw error;

      if (data.success && data.data) {
        setReels(data.data);
        setVisibleReels(6); // Reset to show first 6
        toast({
          title: "Success!",
          description: `Fetched ${data.data.length} posts from @${instagramUsername}`,
        });
      } else {
        throw new Error(data.error || 'Failed to scrape Instagram data');
      }
    } catch (error) {
      console.error('Error scraping Instagram:', error);
      toast({
        title: "Scraping failed",
        description: "Failed to fetch Instagram data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setScrapingLoading(false);
    }
  };

  const loadViralReels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instagram_reels')
        .select('*')
        .order('viral_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      // If no real data, show mock data for demo
      if (!data || data.length === 0) {
        setReels(generateMockReels());
      } else {
        setReels(data);
      }
    } catch (error) {
      console.error('Error loading reels:', error);
      toast({
        title: "Error loading reels",
        description: "Using demo data for now",
        variant: "destructive",
      });
      setReels(generateMockReels());
    } finally {
      setLoading(false);
    }
  };

  const generateMockReels = (): InstagramReel[] => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: `mock-${i}`,
      post_id: `post_${i}`,
      url: `https://instagram.com/p/mock${i}`,
      caption: [
        "This morning routine changed my life! ✨ Try it for 30 days and see the difference #morningroutine #productivity #wellness",
        "POV: You're the main character in your own story 💫 Stop waiting for permission to shine #confidence #selflove #motivation",
        "5 books that will change your mindset forever 📚 Save this post! #books #mindset #personalgrowth #reading",
        "The outfit formula that never fails ✨ Comment 'YES' if you want more style tips #fashion #style #ootd #outfit",
        "Healthy meal prep in 20 minutes! 🥗 Your future self will thank you #mealprep #healthy #nutrition #wellness"
      ][i % 5],
      hashtags: [
        ['#viral', '#trending', '#fyp'],
        ['#motivation', '#inspiration', '#mindset'],
        ['#lifestyle', '#wellness', '#selfcare'],
        ['#fashion', '#style', '#outfit'],
        ['#fitness', '#health', '#wellness']
      ][i % 5],
      username: [
        'wellness_guru',
        'mindset_coach',
        'book_lover',
        'style_maven',
        'fit_lifestyle'
      ][i % 5],
      display_name: [
        'Wellness Guru',
        'Mindset Coach',
        'Book Lover',
        'Style Maven',
        'Fit Lifestyle'
      ][i % 5],
      followers: Math.floor(Math.random() * 500000) + 50000,
      verified: Math.random() > 0.7,
      likes: Math.floor(Math.random() * 100000) + 10000,
      comments: Math.floor(Math.random() * 5000) + 500,
      video_view_count: Math.floor(Math.random() * 1000000) + 100000,
      viral_score: Math.floor(Math.random() * 50) + 50,
      engagement_rate: Math.floor(Math.random() * 10) + 5,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      scraped_at: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
      thumbnail_url: ''
    }));
  };

  const filteredReels = reels.filter(reel => {
    const matchesSearch = !searchTerm || 
      reel.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reel.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reel.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilters = 
      reel.viral_score >= filterOptions.minViralScore &&
      reel.likes >= filterOptions.minLikes;

    return matchesSearch && matchesFilters;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const posted = new Date(timestamp);
    const diff = now.getTime() - posted.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Viral Instagram Reels</h1>
          <p className="text-muted-foreground">
            Discover trending content and viral patterns
          </p>
        </div>
        <Button onClick={loadViralReels} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Instagram Username Scraper */}
      <Card className="p-6 bg-gradient-to-r from-instagram-pink/10 via-instagram-purple/10 to-instagram-orange/10 border-instagram-purple/20">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-instagram-purple" />
              Scrape Instagram User
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter an Instagram username to fetch their latest posts sorted by engagement
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-3 text-muted-foreground">@</span>
                <Input
                  placeholder="instagram_username"
                  value={instagramUsername}
                  onChange={(e) => setInstagramUsername(e.target.value)}
                  className="pl-8"
                  onKeyDown={(e) => e.key === 'Enter' && !scrapingLoading && scrapeInstagramUser()}
                />
              </div>
              <Button 
                onClick={scrapeInstagramUser} 
                disabled={scrapingLoading}
                className="bg-gradient-to-r from-instagram-pink to-instagram-purple hover:opacity-90"
              >
                {scrapingLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Scrape
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by caption, username, or hashtags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{filteredReels.length}</p>
            <p className="text-sm text-muted-foreground">Viral Reels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {Math.round(filteredReels.reduce((acc, reel) => acc + reel.viral_score, 0) / filteredReels.length) || 0}
            </p>
            <p className="text-sm text-muted-foreground">Avg Viral Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-instagram-orange">
              {formatNumber(filteredReels.reduce((acc, reel) => acc + reel.likes, 0))}
            </p>
            <p className="text-sm text-muted-foreground">Total Likes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-instagram-purple">
              {Math.round(filteredReels.reduce((acc, reel) => acc + reel.engagement_rate, 0) / filteredReels.length * 100) / 100 || 0}%
            </p>
            <p className="text-sm text-muted-foreground">Avg Engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Reels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReels.slice(0, visibleReels).map((reel) => (
          <Card key={reel.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            {/* Thumbnail */}
            <div className="aspect-video bg-gradient-to-br from-instagram-pink/20 via-instagram-purple/20 to-instagram-orange/20 flex items-center justify-center relative">
              <Play className="w-16 h-16 text-primary" />
              <div className="absolute top-3 right-3">
                <Badge className="bg-gradient-to-r from-instagram-pink to-instagram-purple text-white">
                  {reel.viral_score}
                </Badge>
              </div>
              <div className="absolute bottom-3 left-3">
                <Badge variant="secondary" className="bg-black/60 text-white border-none">
                  <Clock className="w-3 h-3 mr-1" />
                  {getTimeAgo(reel.timestamp)}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4">
              {/* Creator Info */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-sm">@{reel.username}</p>
                    {reel.verified && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(reel.followers)} followers
                  </p>
                </div>
              </div>

              {/* Caption */}
              <p className="text-sm mb-3 line-clamp-3">{reel.caption}</p>

              {/* Hashtags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {reel.hashtags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {reel.hashtags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{reel.hashtags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {formatNumber(reel.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {formatNumber(reel.comments)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Play className="w-4 h-4" />
                    {formatNumber(reel.video_view_count)}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {reel.engagement_rate}% ER
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-gradient-to-r from-instagram-pink to-instagram-purple hover:opacity-90">
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Script
                </Button>
                <Button size="sm" variant="outline">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {filteredReels.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reels found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {filteredReels.length > visibleReels && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setVisibleReels(prev => prev + 6)}
          >
            Load More Reels ({filteredReels.length - visibleReels} remaining)
          </Button>
        </div>
      )}
    </div>
  );
};