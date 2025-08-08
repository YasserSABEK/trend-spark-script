import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, TrendingUp, Search, ChevronDown, Loader2, ArrowLeft, Hash } from "lucide-react";
import { ReelCard } from "@/components/ReelCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface TikTokVideo {
  id: string;
  post_id: string;
  url: string;
  caption: string;
  hashtags: string[];
  username: string;
  display_name: string;
  author_avatar: string;
  followers: number;
  verified: boolean;
  digg_count: number;
  comment_count: number;
  share_count: number;
  play_count: number;
  viral_score: number;
  engagement_rate: number;
  timestamp: string;
  scraped_at: string;
  thumbnail_url: string;
  video_url?: string;
  web_video_url?: string;
}

export const HashtagVideos = () => {
  const { hashtagId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleVideos, setVisibleVideos] = useState(12);
  const [filterOptions, setFilterOptions] = useState({
    minViralScore: 30,
    minLikes: 100,
    timeRange: '24h'
  });

  useEffect(() => {
    if (hashtagId) {
      loadHashtagVideos();
    }
  }, [hashtagId]);

  const loadHashtagVideos = async () => {
    try {
      setLoading(true);
      
      // Load videos from TikTok that contain this hashtag
      const { data, error } = await supabase
        .from('tiktok_videos')
        .select('*')
        .contains('hashtags', [hashtagId])
        .order('viral_score', { ascending: false })
        .limit(100);

      if (error) throw error;

      setVideos(data || []);
    } catch (error) {
      console.error('Error loading hashtag videos:', error);
      toast({
        title: "Error loading videos",
        description: "Failed to load videos from database",
        variant: "destructive",
      });
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = !searchTerm || 
      video.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilters = 
      video.viral_score >= filterOptions.minViralScore &&
      video.digg_count >= filterOptions.minLikes;

    return matchesSearch && matchesFilters;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const totalLikes = filteredVideos.reduce((sum, video) => sum + video.digg_count, 0);
  const totalViews = filteredVideos.reduce((sum, video) => sum + video.play_count, 0);
  const avgViralScore = filteredVideos.length > 0 
    ? Math.round(filteredVideos.reduce((sum, video) => sum + video.viral_score, 0) / filteredVideos.length)
    : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
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

        {/* Video grid skeleton */}
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/hashtag-search')} className="cursor-pointer">
              Hashtag Search
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
              onClick={() => navigate('/hashtag-search')}
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
            Explore viral TikTok videos for this hashtag and analyze their performance to inspire your content strategy.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{filteredVideos.length}</p>
                <p className="text-sm text-muted-foreground">Total Videos</p>
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

          {/* Search and Filters */}
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Search videos by caption, username, or hashtags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[250px]"
            />
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter indicators */}
      {(filterOptions.minViralScore > 30 || filterOptions.minLikes > 100 || searchTerm) && (
        <div className="flex gap-2 flex-wrap">
          {searchTerm && (
            <Badge variant="secondary">
              Search: "{searchTerm}"
            </Badge>
          )}
          {filterOptions.minViralScore > 30 && (
            <Badge variant="secondary">
              Viral Score ≥ {filterOptions.minViralScore}
            </Badge>
          )}
          {filterOptions.minLikes > 100 && (
            <Badge variant="secondary">
              Likes ≥ {formatNumber(filterOptions.minLikes)}
            </Badge>
          )}
        </div>
      )}

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No videos found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? `No videos match your search for "${searchTerm}"` : `No videos found for hashtag #${hashtagId}`}
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.slice(0, visibleVideos).map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="aspect-[9/16] bg-gradient-to-br from-primary/10 to-primary/5 relative">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={`Video by ${video.username}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <Hash className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button size="lg" className="rounded-full">
                      <span className="text-xl">▶</span>
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={video.author_avatar || '/placeholder.svg'}
                      alt={video.username}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium">@{video.username}</span>
                    {video.verified && <span className="text-xs">✓</span>}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {video.caption}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>♥ {formatNumber(video.digg_count)}</span>
                    <span>💬 {formatNumber(video.comment_count)}</span>
                    <span>↗ {formatNumber(video.share_count)}</span>
                    <Badge variant="outline" className="text-xs">
                      {video.viral_score}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {visibleVideos < filteredVideos.length && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setVisibleVideos(prev => prev + 12)}
                className="mt-6"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More Videos ({filteredVideos.length - visibleVideos} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};