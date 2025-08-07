import { useAuth } from "@/components/auth/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  FileText, 
  Heart, 
  BarChart3, 
  Clock, 
  Zap, 
  Play,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { CreditWarning } from "@/components/credits/CreditWarning";

interface DashboardStats {
  reelsFoundToday: number;
  scriptsGenerated: number;
  savedIdeas: number;
  activeSearches: number;
  totalSearches: number;
  lastScrapeTime: string;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    reelsFoundToday: 0,
    scriptsGenerated: 0,
    savedIdeas: 0,
    activeSearches: 0,
    totalSearches: 0,
    lastScrapeTime: 'Never'
  });
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load user scripts count
      const { count: scriptsCount } = await supabase
        .from('generated_scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Load recent searches (user's own searches)
      const { data: searches } = await supabase
        .from('search_queue')
        .select('*')
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false })
        .limit(6);

      // Load active searches count
      const { count: activeSearchesCount } = await supabase
        .from('search_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .in('status', ['pending', 'processing']);

      // Load total searches count
      const { count: totalSearchesCount } = await supabase
        .from('search_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Load favorite scripts count
      const { count: favoritesCount } = await supabase
        .from('generated_scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_favorite', true);

      // Load reels found today
      const today = new Date().toISOString().split('T')[0];
      const { count: reelsToday } = await supabase
        .from('instagram_reels')
        .select('*', { count: 'exact', head: true })
        .gte('scraped_at', today);

      // Load last scrape time
      const { data: lastReel } = await supabase
        .from('instagram_reels')
        .select('scraped_at')
        .order('scraped_at', { ascending: false })
        .limit(1)
        .single();

      setStats({
        reelsFoundToday: reelsToday || 0,
        scriptsGenerated: scriptsCount || 0,
        savedIdeas: favoritesCount || 0,
        activeSearches: activeSearchesCount || 0,
        totalSearches: totalSearchesCount || 0,
        lastScrapeTime: lastReel ? new Date(lastReel.scraped_at).toLocaleTimeString() : 'Never'
      });

      setRecentSearches(searches || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Credit Warning */}
      <CreditWarning />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's what's trending on Instagram today
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Last updated: {stats.lastScrapeTime}
            <Button size="sm" variant="outline" onClick={loadDashboardData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Reels Found Today
                </p>
                <p className="text-2xl font-bold">{stats.reelsFoundToday}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Scripts Generated
                </p>
                <p className="text-2xl font-bold">{stats.scriptsGenerated}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-instagram-purple to-instagram-orange flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Saved Ideas
                </p>
                <p className="text-2xl font-bold">{stats.savedIdeas}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-instagram-orange to-instagram-yellow flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Searches
                </p>
                <p className="text-2xl font-bold">{stats.activeSearches}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with the most popular features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/viral-reels">
              <Button className="w-full h-auto p-6 flex flex-col items-center gap-2 bg-gradient-to-r from-instagram-pink to-instagram-purple hover:opacity-90">
                <TrendingUp className="w-8 h-8" />
                <span className="font-semibold">Browse Viral Reels</span>
                <span className="text-sm opacity-90">Discover trending content</span>
              </Button>
            </Link>

            <Link to="/script-generator">
              <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center gap-2 border-2 hover:border-primary">
                <Zap className="w-8 h-8" />
                <span className="font-semibold">Generate Script</span>
                <span className="text-sm text-muted-foreground">Create viral content</span>
              </Button>
            </Link>

            <Link to="/analytics">
              <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center gap-2 border-2 hover:border-primary">
                <BarChart3 className="w-8 h-8" />
                <span className="font-semibold">View Analytics</span>
                <span className="text-sm text-muted-foreground">Track performance</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Searches */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Searches</CardTitle>
            <CardDescription>
              Your latest Instagram profile searches
            </CardDescription>
          </div>
          <Link to="/viral-reels">
            <Button variant="outline" size="sm">
              New Search
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentSearches.length > 0 ? (
            <div className="space-y-4">
              {recentSearches.map((search) => {
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

                return (
                  <Card key={search.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center text-white font-semibold text-sm">
                          {search.username ? search.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-medium">@{search.username}</p>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(search.status)}
                            <span className="text-sm text-muted-foreground">
                              {new Date(search.requested_at).toLocaleDateString()} at {new Date(search.requested_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(search.status)}
                        {search.status === 'completed' && search.total_results > 0 && (
                          <Link to={`/reel-results?username=${search.username}`}>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Eye className="w-4 h-4" />
                              View Results ({search.total_results})
                            </Button>
                          </Link>
                        )}
                        {search.status === 'failed' && (
                          <Button size="sm" variant="outline" className="gap-1 text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No searches yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by searching for Instagram profiles to analyze their viral content
              </p>
              <Link to="/viral-reels">
                <Button>
                  Start Searching
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};