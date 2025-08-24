import { useAuth } from "@/components/auth/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  FileText, 
  Hash,
  Users,
  Zap,
  Play,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Search,
  ArrowRight,
  Instagram,
  Video
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditWarning } from "@/components/credits/CreditWarning";
import { DashboardContainer } from "@/components/layout/DashboardContainer";
import { normalizeUsername } from "@/utils/username";

const features = [
  {
    title: "Find Viral Reels",
    description: "Discover trending Instagram content",
    icon: TrendingUp,
    href: "/viral-reels",
    gradient: "from-instagram-pink to-instagram-purple"
  },
  {
    title: "Instagram Creators",
    description: "Find top performing creators",
    icon: Users,
    href: "/instagram-creators",
    gradient: "from-instagram-purple to-instagram-orange"
  },
  {
    title: "TikTok Creators",
    description: "Explore viral TikTok profiles",
    icon: Video,
    href: "/tiktok-creators",
    gradient: "from-instagram-orange to-instagram-yellow"
  },
  {
    title: "Instagram Hashtags",
    description: "Research trending hashtags",
    icon: Hash,
    href: "/instagram-hashtags",
    gradient: "from-instagram-yellow to-instagram-pink"
  },
  {
    title: "TikTok Hashtags",
    description: "Find viral TikTok hashtags",
    icon: Hash,
    href: "/hashtag-search",
    gradient: "from-instagram-pink to-secondary"
  },
  {
    title: "Generate AI Scripts",
    description: "Create viral video scripts",
    icon: Zap,
    href: "/script-generator",
    gradient: "from-secondary to-accent"
  },
  {
    title: "My Scripts",
    description: "View your saved scripts",
    icon: FileText,
    href: "/my-scripts",
    gradient: "from-accent to-instagram-orange"
  },
  {
    title: "Content Calendar",
    description: "Plan your content strategy",
    icon: Calendar,
    href: "/content/calendar",
    gradient: "from-instagram-orange to-instagram-purple"
  }
];

export const Dashboard = () => {
  const { user } = useAuth();
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecentSearches();
    }
  }, [user]);

  const loadRecentSearches = async () => {
    try {
      const { data: searches } = await supabase
        .from('search_queue')
        .select('*')
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false })
        .limit(6);

      setRecentSearches(searches || []);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    try {
      await supabase
        .from('search_queue')
        .delete()
        .eq('id', searchId);
      
      setRecentSearches(prev => prev.filter(search => search.id !== searchId));
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { text: 'Completed', className: 'bg-green-500/10 text-green-700 border-green-200' },
      processing: { text: 'Processing', className: 'bg-blue-500/10 text-blue-700 border-blue-200' },
      failed: { text: 'Failed', className: 'bg-red-500/10 text-red-700 border-red-200' },
      pending: { text: 'Pending', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant="outline" className={config.className}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardContainer>
      <CreditWarning />
      
      {/* Hero Section */}
      <div className="text-center py-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-instagram-pink via-instagram-purple to-instagram-orange bg-clip-text text-transparent">
          What would you like to do today?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose from our powerful tools to discover viral content, analyze creators, and grow your social media presence
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.title} to={feature.href} className="group">
              <Card variant="floating" className="h-full bg-white/80 backdrop-blur-sm border-white/20 group-hover:bg-white/90">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-float-sm`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Searches */}
      <Card variant="floating" className="mb-12 bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Recent Searches</CardTitle>
            <CardDescription>
              Your latest profile and hashtag searches
            </CardDescription>
          </div>
          <Link to="/viral-reels">
            <Button variant="outline" size="sm" className="gap-2">
              New Search
              <Search className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentSearches.length > 0 ? (
            <div className="grid gap-4">
              {recentSearches.map((search) => (
                <Card key={search.id} variant="floating" className="p-4 bg-white/70 backdrop-blur-sm border-white/20 hover:bg-white/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center text-white font-semibold">
                        {search.username ? search.username.charAt(0).toUpperCase() : search.hashtag ? '#' : 'U'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {search.username ? `@${search.username}` : search.hashtag ? `#${search.hashtag}` : 'Unknown'}
                          </p>
                          {search.platform && (
                            <Badge variant="secondary" className="text-xs">
                              {search.platform}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getStatusIcon(search.status)}
                          <span>
                            {new Date(search.requested_at).toLocaleDateString()} at {new Date(search.requested_at).toLocaleTimeString()}
                          </span>
                          {search.total_results > 0 && (
                            <span className="text-primary font-medium">
                              • {search.total_results} results
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(search.status)}
                      {search.status === 'completed' && search.total_results > 0 && (
                        <Link to={search.username ? `/reels/${normalizeUsername(search.username)}` : `/hashtag-videos?hashtag=${search.hashtag}`}>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Eye className="w-4 h-4" />
                            View Results
                          </Button>
                        </Link>
                      )}
                      {search.status === 'failed' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                          onClick={() => handleDeleteSearch(search.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No searches yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start by searching for Instagram profiles or hashtags to analyze viral content and discover trends
                </p>
              </div>
              <Link to="/viral-reels">
                <Button className="gap-2">
                  Start Searching
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Now - Placeholder */}
      <Card variant="floating" className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl">Trending Now</CardTitle>
          <CardDescription>
            Discover what's going viral across social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-instagram-orange to-instagram-yellow flex items-center justify-center mx-auto">
              <Play className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're working on bringing you real-time trending content from across all platforms
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Instagram className="w-3 h-3" />
                Instagram
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Video className="w-3 h-3" />
                TikTok
              </Badge>
              <Badge variant="outline">
                YouTube Shorts
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardContainer>
  );
};