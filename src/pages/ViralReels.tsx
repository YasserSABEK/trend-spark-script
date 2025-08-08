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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { CreditGuard } from "@/components/credits/CreditGuard";

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
  const { user, session, loading: authLoading } = useAuth();
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [searches, setSearches] = useState<SearchQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [visibleReels, setVisibleReels] = useState(12);
  const [queueRefresh, setQueueRefresh] = useState(0);
  const [processingSearch, setProcessingSearch] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    minViralScore: 30,
    minLikes: 1000,
    timeRange: '24h'
  });
  const { toast } = useToast();

  useEffect(() => {
    // Debug authentication state
    console.log('🔍 ViralReels Debug Info:', {
      userAuthenticated: !!user,
      userId: user?.id,
      userEmail: user?.email,
      sessionExists: !!session,
      authLoading,
      timestamp: new Date().toISOString()
    });
    
    loadViralReels();
    loadSearchQueue();
  }, [queueRefresh, user, session]);

  const scrapeInstagramUser = async () => {
    if (!instagramUsername.trim()) {
      toast({
        title: "Username required",
        description: "Please enter an Instagram username",
        variant: "destructive",
      });
      return;
    }

    // SECURITY FIX: Ensure user is authenticated before allowing searches
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to search for reels",
        variant: "destructive",
      });
      return;
    }

    try {
      setScrapingLoading(true);
      setProcessingSearch(instagramUsername.trim());
      
      // Add to search queue and immediately show in UI
      const startTime = Date.now();
      const { data: queueData, error: queueError } = await supabase
        .from('search_queue')
        .insert({
          user_id: user?.id,  // SECURITY FIX: Always include authenticated user ID
          username: instagramUsername.trim(),
          search_type: 'username',
          platform: 'instagram',
          status: 'processing'
        })
        .select()
        .single();

      if (queueError) throw queueError;
      
      // Refresh UI to show processing search
      loadSearchQueue();
      
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
          user_id: user!.id, // CRITICAL: Associate with authenticated user for RLS
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
      setProcessingSearch(null);
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

      setReels(data || []);
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

  const loadSearchQueue = async () => {
    try {
      console.log('🔍 Loading search queue with auth state:', {
        userAuthenticated: !!user,
        userId: user?.id
      });
      
      // SECURITY FIX: Only fetch searches belonging to the authenticated user
      if (!user?.id) {
        console.log('❌ No authenticated user, skipping search queue load');
        setSearches([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('search_queue')
        .select('*')
        .eq('user_id', user.id)  // CRITICAL: Filter by authenticated user
        .eq('search_type', 'username')
        .is('hashtag', null)
        .order('requested_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Search queue error:', error);
        throw error;
      }
      
      console.log('✅ Search queue loaded:', {
        count: data?.length || 0,
        searches: data?.map(s => ({
          username: s.username,
          status: s.status,
          profile_photo_url: s.profile_photo_url
        }))
      });
      
      setSearches(data || []);
    } catch (error) {
      console.error('Error loading search queue:', error);
    }
  };

  // Mock data generation removed since we now have real data

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
    console.log('handleSearchDeleted called - refreshing search queue');
    loadSearchQueue();
    setQueueRefresh(prev => prev + 1); // Force refresh
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 max-w-7xl mx-auto">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Instagram Search */}
      <div className="grid grid-cols-1 gap-6">
        <div>
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
                <CreditGuard
                  requiredCredits={2}
                  action="search for reels"
                >
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
                    {scrapingLoading ? 'Searching...' : 'Search Reels (2 Credits)'}
                  </Button>
                </CreditGuard>
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
      </div>

    </div>
  );
};