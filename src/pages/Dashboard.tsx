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
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  reelsFoundToday: number;
  scriptsGenerated: number;
  savedIdeas: number;
  lastScrapeTime: string;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    reelsFoundToday: 0,
    scriptsGenerated: 0,
    savedIdeas: 0,
    lastScrapeTime: 'Never'
  });
  const [recentReels, setRecentReels] = useState<any[]>([]);
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

      // Load recent Instagram reels (public data)
      const { data: reels } = await supabase
        .from('instagram_reels')
        .select('*')
        .order('scraped_at', { ascending: false })
        .limit(6);

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
        savedIdeas: 0, // Will be implemented with favorites
        lastScrapeTime: lastReel ? new Date(lastReel.scraped_at).toLocaleTimeString() : 'Never'
      });

      setRecentReels(reels || []);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's what's trending on Instagram today
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Last updated: {stats.lastScrapeTime}
          <Button size="sm" variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
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
                  Success Rate
                </p>
                <p className="text-2xl font-bold">89%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
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

      {/* Recent Viral Reels */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Viral Reels</CardTitle>
            <CardDescription>
              Latest trending content from Instagram
            </CardDescription>
          </div>
          <Link to="/viral-reels">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentReels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentReels.map((reel) => (
                <Card key={reel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-instagram-pink/20 to-instagram-purple/20 flex items-center justify-center">
                    <Play className="w-12 h-12 text-primary" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="bg-gradient-to-r from-instagram-pink to-instagram-purple text-white">
                        Viral Score: {reel.viral_score || 85}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {reel.scraped_at ? new Date(reel.scraped_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-2">@{reel.username || 'creator'}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {reel.caption || 'Viral content that\'s taking Instagram by storm...'}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {reel.likes ? `${(reel.likes / 1000).toFixed(1)}k` : '12.5k'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          {reel.video_view_count ? `${(reel.video_view_count / 1000).toFixed(1)}k` : '89.2k'}
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        Generate Script
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No viral content yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by browsing viral reels to discover trending content
              </p>
              <Link to="/viral-reels">
                <Button>
                  Browse Viral Reels
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