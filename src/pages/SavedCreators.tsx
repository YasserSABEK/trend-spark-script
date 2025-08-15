import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Instagram, Music2, ExternalLink, Heart, Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavedCreator {
  id: string;
  username: string;
  display_name: string | null;
  platform: string;
  avatar_url: string | null;
  follower_count: number | null;
  profile_url: string | null;
  created_at: string;
}

export default function SavedCreators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedCreators, setSavedCreators] = useState<SavedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadSavedCreators = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_creators')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedCreators(data || []);
    } catch (error) {
      console.error('Error loading saved creators:', error);
      toast({
        title: "Error",
        description: "Failed to load saved creators",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCreator = async (creatorId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_creators')
        .delete()
        .eq('id', creatorId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedCreators(prev => prev.filter(creator => creator.id !== creatorId));
      toast({
        title: "Success",
        description: "Creator removed from saved list",
      });
    } catch (error) {
      console.error('Error deleting creator:', error);
      toast({
        title: "Error",
        description: "Failed to remove creator",
        variant: "destructive",
      });
    }
  };

  const formatFollowerCount = (count: number | null) => {
    if (!count) return "N/A";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  useEffect(() => {
    loadSavedCreators();
  }, [user]);

  const filteredCreators = savedCreators.filter(creator =>
    creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (creator.display_name && creator.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saved Creators</h1>
            <p className="text-muted-foreground">
              Manage your saved creators across Instagram and TikTok
            </p>
          </div>
          <Badge variant="secondary" className="gap-2">
            <Users className="w-4 h-4" />
            {savedCreators.length} Saved
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search saved creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCreators.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No creators match your search" : "No saved creators yet"}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery 
                  ? "Try adjusting your search terms"
                  : "Start saving creators from the Instagram and TikTok discovery pages"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCreators.map((creator) => (
              <Card key={creator.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={creator.avatar_url || undefined} alt={creator.display_name || creator.username} />
                        <AvatarFallback>
                          {(creator.display_name || creator.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {creator.display_name || creator.username}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          {creator.platform === "instagram" ? (
                            <Instagram className="w-3 h-3" />
                          ) : (
                            <Music2 className="w-3 h-3" />
                          )}
                          @{creator.username}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {creator.platform}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        Followers
                      </div>
                      <div className="font-medium">{formatFollowerCount(creator.follower_count)}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        Platform
                      </div>
                      <div className="font-medium capitalize">{creator.platform}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {creator.profile_url && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => window.open(creator.profile_url!, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Visit
                        </Button>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCreator(creator.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Saved on {new Date(creator.created_at).toLocaleDateString()}
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