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
        const videosToInsert = data.data.map((video: any) => ({
          user_id: user!.id,
          post_id: video.webVideoUrl?.split('/').pop() || video.id || `tiktok_${Date.now()}_${Math.random()}`,
          url: video.webVideoUrl || video.url,
          web_video_url: video.webVideoUrl || video.url,
          caption: video.text || video.caption || '',
          hashtags: video.hashtags || [],
          mentions: video.mentions || [],
          username: video.authorMeta?.name || video.username || normalized,
          display_name: video.authorMeta?.nickname || video.display_name || null,
          author_avatar: video.authorMeta?.avatar || video.author_avatar || null,
          followers: video.authorMeta?.fans || video.followers || null,
          verified: video.authorMeta?.verified || video.verified || false,
          digg_count: video.diggCount ?? video.digg_count ?? 0,
          comment_count: video.commentCount ?? video.comment_count ?? 0,
          play_count: video.playCount ?? video.play_count ?? 0,
          share_count: video.shareCount ?? video.share_count ?? 0,
          collect_count: video.collectCount ?? video.collect_count ?? 0,
          video_duration: video.videoMeta?.duration ?? video.video_duration ?? null,
          is_video: true,
          thumbnail_url: video.covers?.default || video.videoMeta?.coverUrl || video.videoMeta?.originalCoverUrl || video.thumbnail_url || video.thumbnail || null,
          video_url: video.videoUrl || video.downloadUrl || null,
          music_name: video.musicMeta?.musicName || video.music_name || null,
          music_author: video.musicMeta?.musicAuthor || video.music_author || null,
          music_original: video.musicMeta?.musicOriginal || video.music_original || false,
          viral_score: video.viral_score ?? 0,
          engagement_rate: video.engagement_rate ?? 0,
          timestamp: video.createTimeISO || video.timestamp || new Date().toISOString(),
          platform: 'tiktok'
        }));

        const { error: insertError } = await supabase
          .from('tiktok_videos')
          .insert(videosToInsert);

        if (insertError) {
          console.error('Error inserting TikTok videos:', insertError);
        }

        await supabase
          .from('search_queue')
          .update({ 
            status: 'completed',
            total_results: videosToInsert.length,
            processing_time_seconds: processingTime,
            completed_at: new Date().toISOString()
          })
          .eq('id', queueData.id);

        toast({
          title: "Success!",
          description: `Found ${videosToInsert.length} TikToks from @${normalized} and saved to database`,
        });
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
