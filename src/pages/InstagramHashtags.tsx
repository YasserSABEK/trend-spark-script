import { useState, useEffect } from "react";
import { Hash, Search, Loader2, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveSearch } from "@/components/ui/responsive-search";
import { CreditGuard } from "@/components/credits/CreditGuard";
import { InstagramHashtagCard } from "@/components/InstagramHashtagCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { toast } from "sonner";

interface HashtagSearch {
  id: string;
  hashtag: string;
  status: string;
  total_results: number;
  requested_at: string;
  completed_at?: string;
  platform?: string;
}

export function InstagramHashtags() {
  const { user } = useAuth();
  const { balance, hasCredits } = useCreditBalance();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [searches, setSearches] = useState<HashtagSearch[]>([]);

  useEffect(() => {
    if (user) {
      loadSearchHistory();
    }
  }, [user]);

  // Add real-time polling for processing searches
  useEffect(() => {
    const hasProcessingSearches = searches.some(search => 
      search.status === 'pending' || search.status === 'processing'
    );

    if (!hasProcessingSearches || !user) return;

    const pollInterval = setInterval(() => {
      loadSearchHistory();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [searches, user]);

  const scrapeHashtagPosts = async (hashtag: string) => {
    if (!user) {
      toast.error("Please sign in to search hashtags");
      return;
    }

    if (!hasCredits(5)) {
      toast.error("Insufficient credits. You need 5 credits for Instagram hashtag search.");
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
      requested_at: new Date().toISOString(),
      platform: 'instagram'
    };
    
    // Add temporary entry to show pending state
    setSearches(prev => [tempSearchEntry, ...prev]);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-instagram-hashtags', {
        body: { hashtag: cleanHashtag }
      });

      if (error) {
        console.error('Function invoke error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('402') || error.message?.includes('insufficient')) {
          toast.error("Insufficient credits. You need 5 credits for Instagram hashtag search.");
        } else {
          toast.error(`Error: ${error.message || 'Failed to search hashtag'}`);
        }
        
        setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
        return;
      }

      if (data?.code === 'INSUFFICIENT_CREDITS') {
        toast.error("Insufficient credits. You need 5 credits for Instagram hashtag search.");
        setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
        return;
      }

      if (data?.success === false) {
        console.error('Function returned error:', data);
        toast.error(data.error || "Failed to search hashtag - please try again");
        setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
        return;
      }

      if (data?.success) {
        toast.success(`Found ${data.reelsFound || data.videosFound || 0} Instagram Reels for #${cleanHashtag}`);
        setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
        await loadSearchHistory();
      } else {
        console.error('Unexpected response format:', data);
        toast.error("Unexpected response from server - please try again");
        setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
      }
    } catch (error) {
      console.error('Error during hashtag search:', error);
      toast.error("Network error occurred while searching hashtag");
      setSearches(prev => prev.filter(s => s.id !== tempSearchEntry.id));
    } finally {
      setLoading(false);
    }
  };

  const loadSearchHistory = async () => {
    if (!user) return;
    
    try {
      // First try to load from search_queue for Instagram
      const { data: queueData, error: queueError } = await supabase
        .from('search_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('search_type', 'hashtag')
        .eq('platform', 'instagram')
        .order('requested_at', { ascending: false })
        .limit(10);

      if (!queueError && queueData && queueData.length > 0) {
        setSearches(queueData);
        return;
      }

      // Fallback: derive from instagram_reels table
      const { data: reelsData, error: reelsError } = await supabase
        .from('instagram_reels')
        .select('search_hashtag, scraped_at')
        .eq('user_id', user.id)
        .not('search_hashtag', 'is', null)
        .order('scraped_at', { ascending: false });

      if (!reelsError && reelsData) {
        // Group by hashtag and create search entries
        const hashtagCounts = reelsData.reduce((acc, reel) => {
          if (reel.search_hashtag) {
            if (!acc[reel.search_hashtag]) {
              acc[reel.search_hashtag] = {
                count: 0,
                latest: reel.scraped_at
              };
            }
            acc[reel.search_hashtag].count++;
          }
          return acc;
        }, {} as Record<string, { count: number; latest: string }>);

        const derivedSearches: HashtagSearch[] = Object.entries(hashtagCounts)
          .slice(0, 10)
          .map(([hashtag, data]) => ({
            id: `derived-${hashtag}`,
            hashtag,
            status: 'completed',
            total_results: data.count,
            requested_at: data.latest,
            platform: 'instagram'
          }));

        setSearches(derivedSearches);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      scrapeHashtagPosts(searchTerm.trim());
    }
  };

  const handleHashtagDeleted = () => {
    loadSearchHistory();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-6">
        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Search Instagram Hashtags
            </CardTitle>
            <CardDescription>
              Search for viral Instagram Reels by hashtag (5 credits per search)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreditGuard requiredCredits={5} action="hashtag search">
              <ResponsiveSearch
                placeholder="Enter hashtag (e.g., travel, fitness, food)"
                value={searchTerm}
                onChange={setSearchTerm}
                onSubmit={handleSearch}
                disabled={loading}
                loading={loading}
                buttonText="Search Reels"
                buttonIcon={<Search className="w-4 h-4" />}
                leftIcon={<Hash className="w-4 h-4" />}
                buttonClassName="bg-gradient-to-r from-instagram-pink to-instagram-purple hover:opacity-90"
              />
            </CreditGuard>
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
                <InstagramHashtagCard
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
      </div>
    </div>
  );
}