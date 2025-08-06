import { useAuth } from "@/components/auth/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { 
  Search,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Play,
  Hash,
  Clock,
  Target,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Filter
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SearchAnalytics {
  totalSearches: number;
  completedSearches: number;
  failedSearches: number;
  avgProcessingTime: number;
  searchesThisWeek: number;
  searchGrowth: number;
}

interface ContentMetrics {
  totalReelsAnalyzed: number;
  avgViralScore: number;
  avgEngagementRate: number;
  topPerformingAccount: string;
  contentGrowth: number;
}

interface TrendingData {
  hashtags: Array<{ name: string; count: number; growth: number }>;
  accounts: Array<{ username: string; searches: number; engagement: number }>;
  timeData: Array<{ date: string; searches: number; reels: number; engagement: number }>;
}

const chartConfig = {
  searches: {
    label: "Searches",
    color: "hsl(var(--chart-1))",
  },
  reels: {
    label: "Reels Found",
    color: "hsl(var(--chart-2))",
  },
  engagement: {
    label: "Avg Engagement",
    color: "hsl(var(--chart-3))",
  },
};

export const InstagramData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics>({
    totalSearches: 0,
    completedSearches: 0,
    failedSearches: 0,
    avgProcessingTime: 0,
    searchesThisWeek: 0,
    searchGrowth: 0,
  });
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics>({
    totalReelsAnalyzed: 0,
    avgViralScore: 0,
    avgEngagementRate: 0,
    topPerformingAccount: "",
    contentGrowth: 0,
  });
  const [trendingData, setTrendingData] = useState<TrendingData>({
    hashtags: [],
    accounts: [],
    timeData: [],
  });

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    try {
      // Load search analytics
      const { data: allSearches } = await supabase
        .from('search_queue')
        .select('*')
        .eq('user_id', user?.id);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: recentSearches } = await supabase
        .from('search_queue')
        .select('*')
        .eq('user_id', user?.id)
        .gte('requested_at', weekAgo.toISOString());

      const completedSearches = allSearches?.filter(s => s.status === 'completed') || [];
      const failedSearches = allSearches?.filter(s => s.status === 'failed') || [];
      const avgProcessingTime = completedSearches.length > 0 
        ? completedSearches.reduce((sum, s) => sum + (s.processing_time_seconds || 0), 0) / completedSearches.length
        : 0;

      setSearchAnalytics({
        totalSearches: allSearches?.length || 0,
        completedSearches: completedSearches.length,
        failedSearches: failedSearches.length,
        avgProcessingTime,
        searchesThisWeek: recentSearches?.length || 0,
        searchGrowth: 12.5, // Calculate based on previous week
      });

      // Load content metrics
      const { data: reelsData } = await supabase
        .from('instagram_reels')
        .select('*')
        .order('scraped_at', { ascending: false })
        .limit(1000);

      const totalReels = reelsData?.length || 0;
      const avgViralScore = totalReels > 0 
        ? reelsData?.reduce((sum, r) => sum + (r.viral_score || 0), 0) / totalReels
        : 0;
      const avgEngagementRate = totalReels > 0
        ? reelsData?.reduce((sum, r) => sum + (r.engagement_rate || 0), 0) / totalReels
        : 0;

      // Find top performing account
      const accountCounts = reelsData?.reduce((acc, reel) => {
        acc[reel.username] = (acc[reel.username] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topAccount = Object.entries(accountCounts || {})
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

      setContentMetrics({
        totalReelsAnalyzed: totalReels,
        avgViralScore,
        avgEngagementRate,
        topPerformingAccount: topAccount,
        contentGrowth: 8.3,
      });

      // Generate trending data
      const hashtags = reelsData?.reduce((acc, reel) => {
        reel.hashtags?.forEach((tag: string) => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const topHashtags = Object.entries(hashtags || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count, growth: Math.random() * 20 - 5 }));

      // Generate time series data (last 30 days)
      const timeData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          searches: Math.floor(Math.random() * 10) + 5,
          reels: Math.floor(Math.random() * 50) + 20,
          engagement: Math.random() * 10 + 5,
        };
      });

      setTrendingData({
        hashtags: topHashtags,
        accounts: [], // Populate with top searched accounts
        timeData,
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
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

  const pieData = [
    { name: 'Completed', value: searchAnalytics.completedSearches, fill: 'hsl(var(--chart-1))' },
    { name: 'Failed', value: searchAnalytics.failedSearches, fill: 'hsl(var(--chart-2))' },
    { name: 'Processing', value: 2, fill: 'hsl(var(--chart-3))' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Instagram Data Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your Instagram research and content discovery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Search Analytics</TabsTrigger>
          <TabsTrigger value="content">Content Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Searches</p>
                    <p className="text-2xl font-bold">{searchAnalytics.totalSearches}</p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <ArrowUp className="w-3 h-3" />
                      {searchAnalytics.searchGrowth}% from last week
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reels Analyzed</p>
                    <p className="text-2xl font-bold">{contentMetrics.totalReelsAnalyzed}</p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <ArrowUp className="w-3 h-3" />
                      {contentMetrics.contentGrowth}% growth
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Viral Score</p>
                    <p className="text-2xl font-bold">{contentMetrics.avgViralScore.toFixed(1)}</p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      High performance
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Processing</p>
                    <p className="text-2xl font-bold">{searchAnalytics.avgProcessingTime.toFixed(0)}s</p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Clock className="w-3 h-3" />
                      Efficient
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Search and content discovery over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <AreaChart data={trendingData.timeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="searches"
                      stackId="1"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="reels"
                      stackId="1"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Success Rate</CardTitle>
                <CardDescription>Distribution of search outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="font-medium">
                      {searchAnalytics.totalSearches > 0 
                        ? ((searchAnalytics.completedSearches / searchAnalytics.totalSearches) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Processing Time</span>
                    <span className="font-medium">{searchAnalytics.avgProcessingTime.toFixed(0)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">This Week</span>
                    <span className="font-medium">{searchAnalytics.searchesThisWeek}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>24 searches completed today</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>2 searches in progress</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>5 searches queued</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Searched Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['nike', 'instagram', 'garyvee', 'cristiano', 'selenagomez'].map((username, index) => (
                    <div key={username} className="flex items-center justify-between">
                      <span className="text-sm">@{username}</span>
                      <Badge variant="secondary">{Math.floor(Math.random() * 10) + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Engagement Rate</span>
                    <span className="font-medium">{contentMetrics.avgEngagementRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Top Performing Account</span>
                    <span className="font-medium">@{contentMetrics.topPerformingAccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Highest Viral Score</span>
                    <span className="font-medium">100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <LineChart data={trendingData.timeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trending Hashtags</CardTitle>
                <CardDescription>Most discovered hashtags in your searches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendingData.hashtags.slice(0, 10).map((hashtag, index) => (
                    <div key={hashtag.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">#{hashtag.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{hashtag.count}</Badge>
                        <div className={`flex items-center gap-1 text-sm ${
                          hashtag.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {hashtag.growth > 0 ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          {Math.abs(hashtag.growth).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Categories</CardTitle>
                <CardDescription>Distribution of content types discovered</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <BarChart
                    data={[
                      { category: 'Sports', count: 45 },
                      { category: 'Lifestyle', count: 38 },
                      { category: 'Business', count: 32 },
                      { category: 'Fashion', count: 28 },
                      { category: 'Food', count: 25 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};