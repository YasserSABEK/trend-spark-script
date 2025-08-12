import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Heart, Play, Users, TrendingUp, Calendar } from 'lucide-react';
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
  follower_count: number;
  viral_post_count: number;
  median_views: number;
  max_views: number;
  total_views: number;
  last_posted_at: string;
  profile_url: string;
  avatar_url: string;
  sample_posts: Array<{
    url: string;
    view_count: number;
  }>;
}

interface SearchResult {
  query: string;
  creators: Creator[];
  total_creators: number;
  search_completed_at: string;
  source: 'cache' | 'fresh';
}

export default function InstagramCreatorResults() {
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
      const { data, error } = await supabase.functions.invoke('search-instagram-creators', {
        body: { 
          getUserResults: true, 
          searchId: searchId 
        }
      });

      if (error) throw error;

      setSearchResult(data);
    } catch (error) {
      console.error('Error loading search results:', error);
      toast.error('Failed to load search results');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCreators = async () => {
    // TODO: Load saved creators from database
    // This would query the saved_creators table for the current user
  };

  const handleSaveCreator = (username: string) => {
    // TODO: Implement save creator functionality
    toast.success(`Creator @${username} saved!`);
  };

  const handleScrapeCreator = (username: string) => {
    navigate(`/viral-reels?username=${username}`);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/instagram-creators')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Instagram Creators
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4 animate-pulse">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto" />
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                      <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-8 bg-muted rounded" />
                      <div className="h-8 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          <p className="text-lg text-muted-foreground">Search results not found</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/instagram-creators')}
            className="mt-4"
          >
            Back to Instagram Creators
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/instagram-creators')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Instagram Creators
            </Button>
          </div>
          <Badge variant={searchResult.source === 'cache' ? 'secondary' : 'default'}>
            {searchResult.source === 'cache' ? 'Cached Results' : 'Fresh Results'}
          </Badge>
        </div>

        {/* Results Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Instagram Creators: "{searchResult.query}"
          </h1>
          <p className="text-muted-foreground">
            Found {searchResult.total_creators} creators • 
            Searched {formatTimeAgo(searchResult.search_completed_at)}
          </p>
        </div>

        {/* Creator Grid */}
        {searchResult.creators.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No creators found for this search.</p>
            <p className="text-sm">Try searching for a different niche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResult.creators.map((creator) => (
              <Card key={creator.username} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Avatar and Basic Info */}
                    <div className="text-center space-y-2">
                      <Avatar className="w-16 h-16 mx-auto">
                        <AvatarImage src={creator.avatar_url} alt={creator.username} />
                        <AvatarFallback>
                          {creator.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">@{creator.username}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(creator.follower_count)} followers
                        </p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          Viral Posts
                        </div>
                        <div className="font-medium">
                          {creator.viral_post_count}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Play className="w-3 h-3" />
                          Median Views
                        </div>
                        <div className="font-medium">
                          {formatNumber(creator.median_views)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Heart className="w-3 h-3" />
                          Max Views
                        </div>
                        <div className="font-medium">
                          {formatNumber(creator.max_views)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Last Post
                        </div>
                        <div className="font-medium">
                          {formatTimeAgo(creator.last_posted_at)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveCreator(creator.username)}
                          className="flex-1"
                        >
                          <Heart className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(creator.profile_url, '_blank')}
                          className="flex-1"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Instagram
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleScrapeCreator(creator.username)}
                        className="w-full"
                      >
                        <TrendingUp className="w-3 h-3 mr-2" />
                        Viral Reels
                      </Button>
                    </div>
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