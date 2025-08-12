import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Heart, Play, Users, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PageContainer } from '@/components/layout/PageContainer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

interface Creator {
  username: string;
  display_name: string;
  avatar_url: string;
  follower_count?: number;
  viral_post_count: number;
  median_views: number;
  max_views: number;
  total_views: number;
  last_seen_at: string;
  profile_url: string;
  sample_posts: Array<{
    url: string;
    views: number;
  }>;
}

interface SearchResult {
  query: string;
  creators_count: number;
  videos_processed_count: number;
  last_run_source: string;
  last_run_at: string;
  creators: Creator[];
}

export default function TikTokCreatorResults() {
  const { searchId } = useParams<{ searchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedCreators, setSavedCreators] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (searchId && user) {
      loadSearchResults();
      loadSavedCreators();
    }
  }, [searchId, user]);

  const loadSearchResults = async () => {
    try {
      // Get cached results from the search-tiktok-creators function
      const { data, error } = await supabase.functions.invoke('search-tiktok-creators', {
        body: { searchId, getUserResults: true }
      });

      if (error) throw error;

      if (data) {
        setSearchResult(data);
      } else {
        toast.error('No results found for this search');
      }
    } catch (error) {
      console.error('Error loading search results:', error);
      toast.error('Failed to load search results');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCreators = async () => {
    // Since the saved_creators table was just created and types haven't been updated yet,
    // we'll temporarily skip loading saved creators to avoid type errors
    setSavedCreators(new Set());
  };

  const handleSaveCreator = async (creator: Creator) => {
    // Temporarily disabled until types are updated
    toast.info('Save creator functionality will be enabled after database types are updated');
  };

  const handleScrapeCreator = (username: string) => {
    navigate(`/tiktoks/${username}`);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/tiktok-creators')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!searchResult) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't find any results for this search.
          </p>
          <Button onClick={() => navigate('/tiktok-creators')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/tiktok-creators')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </div>
        </div>

        {/* Search Info */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{searchResult.query}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              Creators found: {searchResult.creators_count}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Play className="w-3 h-3" />
              From {formatNumber(searchResult.videos_processed_count)} videos
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              Source: {searchResult.last_run_source === 'cache' ? 'Cache' : 'Fresh'}
            </Badge>
          </div>
        </div>

        {/* Creator Grid */}
        {searchResult.creators.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Creators Found</h2>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or try a different niche.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResult.creators.map((creator) => (
              <Card key={creator.username} className="group hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  {/* Creator Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={creator.avatar_url} alt={creator.display_name} />
                      <AvatarFallback>
                        {creator.display_name?.charAt(0)?.toUpperCase() || creator.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{creator.display_name || creator.username}</h3>
                      <p className="text-sm text-muted-foreground truncate">@{creator.username}</p>
                      {creator.follower_count && (
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(creator.follower_count)} followers
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Viral posts:</span>
                      <span className="font-medium">{creator.viral_post_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Median views:</span>
                      <span className="font-medium">{formatNumber(creator.median_views)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Max views:</span>
                      <span className="font-medium">{formatNumber(creator.max_views)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last seen:</span>
                      <span className="font-medium">{formatTimeAgo(creator.last_seen_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveCreator(creator)}
                        className="flex-1"
                      >
                        <Heart 
                          className={`w-3 h-3 mr-1 ${
                            savedCreators.has(creator.username) ? 'fill-current text-red-500' : ''
                          }`} 
                        />
                        {savedCreators.has(creator.username) ? 'Saved' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(creator.profile_url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleScrapeCreator(creator.username)}
                      className="w-full"
                    >
                      <Eye className="w-3 h-3 mr-2" />
                      Scrape Videos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}