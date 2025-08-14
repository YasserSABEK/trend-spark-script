import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Instagram, Music2, ExternalLink, Heart, Eye } from "lucide-react";

// Mock data - replace with actual API integration
const mockSavedCreators = [
  {
    id: "1",
    username: "creativecontent",
    displayName: "Creative Content Co",
    platform: "instagram",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b66e5bb8?w=150&h=150&fit=crop&crop=face",
    followers: "125K",
    averageViews: "45K",
    engagement: "4.2%",
    lastPost: "2 hours ago",
    savedAt: "2024-01-15"
  },
  {
    id: "2", 
    username: "tiktoktrendy",
    displayName: "TikTok Trendy",
    platform: "tiktok",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    followers: "89K",
    averageViews: "67K", 
    engagement: "5.8%",
    lastPost: "1 day ago",
    savedAt: "2024-01-14"
  }
];

export default function SavedCreators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedCreators] = useState(mockSavedCreators);

  const filteredCreators = savedCreators.filter(creator =>
    creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.displayName.toLowerCase().includes(searchQuery.toLowerCase())
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

        {filteredCreators.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No saved creators found</h3>
              <p className="text-muted-foreground text-center">
                Start saving creators from the Instagram and TikTok discovery pages
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
                        <AvatarImage src={creator.avatar} alt={creator.displayName} />
                        <AvatarFallback>{creator.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{creator.displayName}</CardTitle>
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
                    <Badge variant="outline" className="text-xs">
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
                      <div className="font-medium">{creator.followers}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        Avg Views
                      </div>
                      <div className="font-medium">{creator.averageViews}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="w-3 h-3" />
                        Engagement
                      </div>
                      <div className="font-medium">{creator.engagement}</div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <ExternalLink className="w-3 h-3" />
                      Visit
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Saved on {new Date(creator.savedAt).toLocaleDateString()}
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