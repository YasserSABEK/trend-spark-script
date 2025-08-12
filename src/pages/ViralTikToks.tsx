import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { SearchCard } from "@/components/SearchCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { CreditGuard } from "@/components/credits/CreditGuard";
import { normalizeUsername } from "@/utils/username";

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

export const ViralTikToks = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [searches, setSearches] = useState<SearchQueueItem[]>([]);
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [queueRefresh, setQueueRefresh] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadSearchQueue();
  }, [queueRefresh, user, session]);

  const scrapeTikTokUser = async () => {
    if (!tiktokUsername.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a TikTok username",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to search for TikToks",
        variant: "destructive",
      });
      return;
    }

    try {
      setScrapingLoading(true);
      const startTime = Date.now();
      const normalized = normalizeUsername(tiktokUsername);

      // Add to search queue immediately
      const { data: queueData, error: queueError } = await supabase
        .from('search_queue')
        .insert({
          user_id: user.id,
          username: normalized,
          search_type: 'username',
          platform: 'tiktok',
          status: 'processing'
        })
        .select()
        .single();

      if (queueError) throw queueError;
      loadSearchQueue();

      const { data, error } = await supabase.functions.invoke('scrape-tiktok-user', {
        body: { username: normalized }
      });

      const processingTime = Math.round((Date.now() - startTime) / 1000);

      if (error) {
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

      if (data?.success && Array.isArray(data.data)) {
        await supabase
          .from('search_queue')
          .update({ 
            status: 'completed',
            total_results: data.data.length,
            processing_time_seconds: processingTime,
            completed_at: new Date().toISOString()
          })
          .eq('id', queueData.id);

        toast({
          title: "Success!",
          description: `Found ${data.data.length} TikToks from @${normalized}`,
        });
        
        // Navigate to results page with video data
        navigate(`/tiktoks/${normalized}`, { state: { videos: data.data } });
        setTiktokUsername('');
      } else {
        await supabase
          .from('search_queue')
          .update({ 
            status: 'failed',
            error_message: data?.error || 'No videos found',
            processing_time_seconds: processingTime,
            completed_at: new Date().toISOString()
          })
          .eq('id', queueData.id);
        throw new Error(data?.error || 'No videos found');
      }
    } catch (err) {
      console.error('Error scraping TikTok user:', err);
      toast({
        title: "Scraping failed",
        description: "Failed to fetch TikTok videos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setScrapingLoading(false);
      setQueueRefresh(prev => prev + 1);
    }
  };

  const loadSearchQueue = async () => {
    try {
      if (!user?.id) {
        setSearches([]);
        return;
      }

      const { data, error } = await supabase
        .from('search_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('search_type', 'username')
        .eq('platform', 'tiktok')
        .order('requested_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSearches(data || []);
    } catch (error) {
      console.error('Error loading TikTok search queue:', error);
    }
  };

  const handleViewResults = (username: string) => {
    const normalized = normalizeUsername(username);
    navigate(`/tiktoks/${normalized}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-4">Discover Viral TikToks</h1>
              <p className="text-muted-foreground mb-6">
                Search for any TikTok username to analyze their most viral videos and get insights for your content strategy.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter TikTok username (e.g., nike, mrbeast)"
                  value={tiktokUsername}
                  onChange={(e) => setTiktokUsername(e.target.value)}
                  className="flex-1"
                  disabled={scrapingLoading}
                />
                <CreditGuard requiredCredits={2} action="search for tiktoks">
                  <Button
                    onClick={scrapeTikTokUser}
                    disabled={scrapingLoading || !tiktokUsername.trim()}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                  >
                    {scrapingLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    {scrapingLoading ? 'Searching...' : 'Search TikToks (2 Credits)'}
                  </Button>
                </CreditGuard>
              </div>
            </CardContent>
          </Card>

          {searches.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Recent Searches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searches.map((search) => (
                  <SearchCard
                    key={search.id}
                    search={search}
                    onViewResults={handleViewResults}
                    onDelete={() => setQueueRefresh(prev => prev + 1)}
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

export default ViralTikToks;
