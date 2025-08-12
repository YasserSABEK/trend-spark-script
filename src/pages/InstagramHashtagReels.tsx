import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Search, ArrowLeft, Hash, Loader2 } from "lucide-react";
import { ReelCard } from "@/components/ReelCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface InstagramReel {
  id: string;
  post_id: string;
  url: string;
  caption: string;
  hashtags: string[];
  username: string;
  display_name: string;
  followers: number | null;
  verified: boolean;
  likes: number | null;
  comments: number | null;
  video_view_count: number | null;
  viral_score: number | null;
  engagement_rate: number | null;
  timestamp: string;
  scraped_at: string;
  thumbnail_url: string;
  video_url?: string;
}

export const InstagramHashtagReels = () => {
  const { hashtagId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const pageSize = 8;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<'views' | 'likes' | 'comments' | 'newest'>((searchParams.get('sort') as any) || 'views');

  // Update URL when sort changes
  useEffect(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (sort !== 'views') {
        newParams.set('sort', sort);
      } else {
        newParams.delete('sort');
      }
      return newParams;
    });
  }, [sort, setSearchParams]);

  useEffect(() => {
    if (!hashtagId) return;
    // Reset pagination
    setReels([]);
    setPage(0);
    setHasMore(true);
    loadHashtagReels(0, false);
  }, [hashtagId, sort]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadHashtagReels(page + 1, true);
    }
  };

  const loadHashtagReels = async (pageIndex = 0, append = false) => {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;

      const sortMap: Record<string, { column: string; ascending: boolean }> = {
        views: { column: 'video_view_count', ascending: false },
        likes: { column: 'likes', ascending: false },
        comments: { column: 'comments', ascending: false },
        newest: { column: 'timestamp', ascending: false },
      };

      const order = sortMap[sort] || sortMap.views;

      const { data, error, count } = await supabase
        .from('instagram_reels')
        .select('*', { count: 'exact' })
        .eq('search_hashtag', hashtagId)
        .order(order.column, { ascending: order.ascending })
        .range(from, to);

      if (error) throw error;

      setTotal(count || 0);
      setReels(prev => append ? [...prev, ...(data || [])] : (data || []));
      setHasMore(((from + (data?.length || 0)) < (count || 0)));
      setPage(pageIndex);
    } catch (error) {
      console.error('Error loading hashtag reels:', error);
      toast({
        title: 'Error loading reels',
        description: 'Failed to load reels from database',
        variant: 'destructive',
      });
      if (!append) setReels([]);
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  };

  const filteredReels = searchTerm
    ? reels.filter((reel) => {
        const term = searchTerm.toLowerCase();
        return (
          (reel.caption || '').toLowerCase().includes(term) ||
          (reel.username || '').toLowerCase().includes(term) ||
          (reel.hashtags || []).some((t) => (t || '').toLowerCase().includes(term))
        );
      })
    : reels;

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Keep stats based on currently loaded reels
  const totalLikes = reels.reduce((sum, reel) => sum + (reel.likes || 0), 0);
  const totalViews = reels.reduce((sum, reel) => sum + (reel.video_view_count || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-6 w-48" />
        
        {/* Header skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Reel grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-[9/16] w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/instagram-hashtags')} className="cursor-pointer">
              Instagram Hashtags
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>#{hashtagId}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/instagram-hashtags')}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Hash className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                #{hashtagId}
              </h1>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Explore viral Instagram Reels for this hashtag and analyze their performance to inspire your content strategy.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-muted-foreground">Total Reels</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardContent className="p-4 text-center">
                <div className="w-6 h-6 rounded-full bg-red-500 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs">♥</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(totalLikes)}</p>
                <p className="text-sm text-muted-foreground">Total Likes</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <CardContent className="p-4 text-center">
                <div className="w-6 h-6 rounded-full bg-purple-500 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs">▶</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(totalViews)}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Sort */}
          <div className="flex gap-2 flex-wrap items-center">
            <Input
              placeholder="Search reels by caption, username, or hashtags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[250px]"
            />
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="views">Top Viewed</SelectItem>
                <SelectItem value="likes">Likes</SelectItem>
                <SelectItem value="comments">Comments</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Filter indicators */}
      {searchTerm && (
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">
            Search: "{searchTerm}"
          </Badge>
        </div>
      )}

      {/* Reels Grid */}
      {total === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reels found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? `No reels match your search for "${searchTerm}"` : `No reels found for hashtag #${hashtagId}`}
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>Clear search</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredReels.map((reel) => (
              <ReelCard
                key={reel.id}
                reel={reel}
                onGenerateScript={undefined}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                size="lg"
                className="min-w-32"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
