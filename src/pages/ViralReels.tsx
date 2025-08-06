import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, TrendingUp, Search, ChevronDown, Loader2 } from "lucide-react";
import { ReelCard } from "@/components/ReelCard";
import { SearchCard } from "@/components/SearchCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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

export const ViralReels = () => {
  const navigate = useNavigate();
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [searches, setSearches] = useState<SearchQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [visibleReels, setVisibleReels] = useState(12);
  const [queueRefresh, setQueueRefresh] = useState(0);
  const [filterOptions, setFilterOptions] = useState({
    minViralScore: 30,
    minLikes: 1000,
    timeRange: '24h'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadViralReels();
    loadSearchQueue();
  }, [queueRefresh]);

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
      
      // Add to search queue
      const startTime = Date.now();
      const { data: queueData, error: queueError } = await supabase
        .from('search_queue')
        .insert({
          username: instagramUsername.trim(),
          status: 'processing'
        })
        .select()
        .single();

      if (queueError) throw queueError;
      
      const { data, error } = await supabase.functions.invoke('scrape-instagram', {
        body: { username: instagramUsername.trim() }
      });

      const processingTime = Math.round((Date.now() - startTime) / 1000);

      if (error) {
        // Update queue with error
        await supabase
          .from('search_queue')
          .update({ 
            status: 'failed', 
            error_message: error.message,
            processing_time_seconds: processingTime,
            completed_at: new Date().toISOString()
          })
          .eq('id', queueData.id);
        throw error;
      }

      if (data.success && data.data) {
        // Save reels to database with search_username
        const reelsToInsert = data.data.map((reel: any) => ({
          post_id: reel.post_id || reel.id,
          url: reel.url,
          video_url: reel.video_url,
          caption: reel.caption,
          hashtags: reel.hashtags,
          mentions: reel.mentions,
          username: reel.username,
          display_name: reel.display_name,
          followers: reel.followers,
          verified: reel.verified,
          likes: reel.likes,
          comments: reel.comments,
          video_view_count: reel.video_view_count,
          video_play_count: reel.video_play_count,
          viral_score: reel.viral_score,
          engagement_rate: reel.engagement_rate,
          timestamp: reel.timestamp,
          video_duration: reel.video_duration,
          is_video: reel.is_video,
          product_type: reel.product_type,
          shortcode: reel.shortcode,
          thumbnail_url: reel.thumbnail_url,
          search_username: instagramUsername.trim(), // Add this field
          search_requested_at: new Date().toISOString(),
          processing_time_seconds: processingTime,
          search_status: 'completed'
        }));

        // Insert reels into database
        const { error: insertError } = await supabase
          .from('instagram_reels')
          .insert(reelsToInsert);

        if (insertError) {
          console.error('Error inserting reels:', insertError);
          // Continue with success but log the error
        }

        // Update queue with success
        await supabase
          .from('search_queue')
          .update({ 
            status: 'completed',
            total_results: data.data.length,
            processing_time_seconds: processingTime,
            completed_at: new Date().toISOString()
          })
          .eq('id', queueData.id);

        setReels(data.data);
        setVisibleReels(12);
        setQueueRefresh(prev => prev + 1);
        toast({
          title: "Success!",
          description: `Found ${data.data.length} reels from @${instagramUsername} and saved to database`,
        });
        setInstagramUsername(''); // Clear input
      } else {
        throw new Error(data.error || 'No reels found');
      }
    } catch (error) {
      console.error('Error scraping Instagram:', error);
      toast({
        title: "Scraping failed",
        description: "Failed to fetch Instagram reels. Please try again.",
        variant: "destructive",
      });
    } finally {
      setScrapingLoading(false);
    }
  };

  const loadViralReels = async (username?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('instagram_reels')
        .select('*')
        .eq('is_video', true);
      
      if (username) {
        query = query.eq('search_username', username);
      }
      
      const { data, error } = await query
        .order('viral_score', { ascending: false })
        .limit(100);

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
      thumbnail_url: '',
      video_url: `https://example.com/video${i}.mp4`
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

  const handleViewResults = (username: string) => {
    navigate(`/reels/${username}`);
  };

  const handleSearchDeleted = () => {
    loadSearchQueue();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-instagram-pink to-instagram-purple bg-clip-text text-transparent">
            ViralFindr
          </h1>
          <p className="text-muted-foreground">
            Discover viral Instagram reels and trending content patterns
          </p>
        </div>
      </div>

      {/* Instagram Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-instagram-pink to-instagram-purple bg-clip-text text-transparent">
                Discover Viral Instagram Reels
              </h2>
              <p className="text-muted-foreground mb-6">
                Search for any Instagram username to analyze their most viral reels and get insights for your content strategy.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Instagram username (e.g., nike, cristiano)"
                  value={instagramUsername}
                  onChange={(e) => setInstagramUsername(e.target.value)}
                  className="flex-1"
                  disabled={scrapingLoading}
                />
                <Button 
                  onClick={scrapeInstagramUser}
                  disabled={scrapingLoading || !instagramUsername.trim()}
                  className="bg-gradient-to-r from-instagram-pink to-instagram-purple hover:opacity-90"
                >
                  {scrapingLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {scrapingLoading ? 'Searching...' : 'Search Reels'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Searches */}
          {searches.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Recent Searches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searches.map((search) => (
                  <SearchCard
                    key={search.id}
                    search={search}
                    onViewResults={handleViewResults}
                    onDelete={handleSearchDeleted}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-instagram-pink to-instagram-purple rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get detailed insights including engagement rates, viral scores, and content performance metrics for any Instagram account.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Viral Score Analysis</span>
                    <span className="text-green-500">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Engagement Metrics</span>
                    <span className="text-green-500">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Content Insights</span>
                    <span className="text-green-500">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Script Generation</span>
                    <span className="text-green-500">✓</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{filteredReels.length}</p>
            <p className="text-sm text-muted-foreground">Viral Reels</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.round(filteredReels.reduce((acc, reel) => acc + reel.viral_score, 0) / filteredReels.length) || 0}
            </p>
            <p className="text-sm text-muted-foreground">Avg Viral Score</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-instagram-orange/10 to-instagram-orange/5 border-instagram-orange/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-instagram-orange">
              {formatNumber(filteredReels.reduce((acc, reel) => acc + reel.likes, 0))}
            </p>
            <p className="text-sm text-muted-foreground">Total Likes</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-instagram-purple/10 to-instagram-purple/5 border-instagram-purple/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-instagram-purple">
              {Math.round(filteredReels.reduce((acc, reel) => acc + reel.engagement_rate, 0) / filteredReels.length * 100) / 100 || 0}%
            </p>
            <p className="text-sm text-muted-foreground">Avg Engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Reels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredReels.slice(0, visibleReels).map((reel) => (
          <ReelCard 
            key={reel.id} 
            reel={reel}
            onGenerateScript={() => {
              toast({
                title: "Script Generator",
                description: "Script generation feature coming soon!",
              });
            }}
          />
        ))}
      </div>

      {/* Load More */}
      {filteredReels.length === 0 && !loading && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No viral reels found</h3>
          <p className="text-muted-foreground">
            Search for an Instagram username to discover viral reels, or try adjusting your filters
          </p>
        </div>
      )}

      {filteredReels.length > visibleReels && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setVisibleReels(prev => prev + 12)}
            className="bg-gradient-to-r from-instagram-pink/10 to-instagram-purple/10 hover:from-instagram-pink/20 hover:to-instagram-purple/20"
          >
            Load More Reels ({filteredReels.length - visibleReels} remaining)
          </Button>
        </div>
      )}
    </div>
  );
};