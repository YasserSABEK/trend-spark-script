import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Play, 
  ExternalLink, 
  Download,
  MoreHorizontal,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ContentItem {
  id: string;
  platform: 'tiktok' | 'instagram';
  url: string;
  thumbnail: string;
  caption: string;
  creator: string;
  createdAt: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    viralityScore: number;
  };
  duration?: number;
  hashtags: string[];
}

type SortField = 'createdAt' | 'views' | 'likes' | 'comments' | 'engagementRate' | 'viralityScore';
type SortDirection = 'asc' | 'desc';
type FilterPlatform = 'all' | 'tiktok' | 'instagram';
type FilterPerformance = 'all' | 'high' | 'medium' | 'low';

export function AnalyticsDashboard() {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>('all');
  const [filterPerformance, setFilterPerformance] = useState<FilterPerformance>('all');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data - in real app, this would come from API
  const mockData: ContentItem[] = [
    {
      id: '1',
      platform: 'tiktok',
      url: 'https://tiktok.com/@user/video/1',
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300',
      caption: 'When people make simple things complicated 🤦🏿‍♂️',
      creator: 'khaby.lame',
      createdAt: '2023-08-15T14:22:15.000Z',
      metrics: {
        views: 45600000,
        likes: 3200000,
        comments: 125000,
        shares: 890000,
        engagementRate: 9.13,
        viralityScore: 94
      },
      duration: 12.5,
      hashtags: ['comedy', 'viral', 'simple', 'funny']
    },
    {
      id: '2',
      platform: 'instagram',
      url: 'https://instagram.com/reel/abc123',
      thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=300',
      caption: 'I spent 50 hours buried alive and this is what happened 😱',
      creator: 'mrbeast',
      createdAt: '2023-08-15T18:30:45.000Z',
      metrics: {
        views: 12500000,
        likes: 1800000,
        comments: 45000,
        shares: 325000,
        engagementRate: 14.76,
        viralityScore: 87
      },
      duration: 85.5,
      hashtags: ['challenge', 'buried', 'experiment', 'viral']
    }
  ];

  // Performance classification
  const getPerformanceLevel = (viralityScore: number): FilterPerformance => {
    if (viralityScore >= 80) return 'high';
    if (viralityScore >= 60) return 'medium';
    return 'low';
  };

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = mockData;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply platform filter
    if (filterPlatform !== 'all') {
      filtered = filtered.filter(item => item.platform === filterPlatform);
    }

    // Apply performance filter
    if (filterPerformance !== 'all') {
      filtered = filtered.filter(item => 
        getPerformanceLevel(item.metrics.viralityScore) === filterPerformance
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else {
        aValue = a.metrics[sortField];
        bValue = b.metrics[sortField];
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [mockData, searchQuery, filterPlatform, filterPerformance, sortField, sortDirection]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (processedData.length === 0) {
      return { totalViews: 0, avgEngagement: 0, topPerformer: null, platforms: { tiktok: 0, instagram: 0 } };
    }

    const totalViews = processedData.reduce((sum, item) => sum + item.metrics.views, 0);
    const avgEngagement = processedData.reduce((sum, item) => sum + item.metrics.engagementRate, 0) / processedData.length;
    const topPerformer = processedData.reduce((best, item) => 
      item.metrics.viralityScore > best.metrics.viralityScore ? item : best
    );
    const platforms = processedData.reduce((acc, item) => {
      acc[item.platform]++;
      return acc;
    }, { tiktok: 0, instagram: 0 });

    return { totalViews, avgEngagement, topPerformer, platforms };
  }, [processedData]);

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle content selection and modal
  const handleContentClick = (content: ContentItem) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  // Send to CRM function
  const sendToCRM = useCallback((content: ContentItem) => {
    // In real app, this would call API to move content to CRM
    console.log('Sending to CRM:', content);
    // Show success toast, close modal, etc.
  }, []);

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />;
  };

  // Render performance badge
  const renderPerformanceBadge = (viralityScore: number) => {
    const level = getPerformanceLevel(viralityScore);
    const variant = level === 'high' ? 'default' : level === 'medium' ? 'secondary' : 'outline';
    const text = level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low';
    
    return <Badge variant={variant}>{text}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Content Analytics</h1>
          <p className="text-muted-foreground">
            Analyze performance metrics and discover insights from your scraped content
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summaryStats.totalViews)}</div>
            <p className="text-xs text-muted-foreground">Across all content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.avgEngagement.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Engagement rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.topPerformer?.metrics.viralityScore || 0}</div>
            <p className="text-xs text-muted-foreground">Virality score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Content Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="outline">TT: {summaryStats.platforms.tiktok}</Badge>
              <Badge variant="outline">IG: {summaryStats.platforms.instagram}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by caption, creator, or hashtags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Platform Filter */}
            <Select value={filterPlatform} onValueChange={(value: FilterPlatform) => setFilterPlatform(value)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>

            {/* Performance Filter */}
            <Select value={filterPerformance} onValueChange={(value: FilterPerformance) => setFilterPerformance(value)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="high">High Performing</SelectItem>
                <SelectItem value="medium">Medium Performing</SelectItem>
                <SelectItem value="low">Low Performing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Preview</TableHead>
                <TableHead>Content</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('views')}
                >
                  <div className="flex items-center gap-1">
                    Views {renderSortIcon('views')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('likes')}
                >
                  <div className="flex items-center gap-1">
                    Likes {renderSortIcon('likes')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('engagementRate')}
                >
                  <div className="flex items-center gap-1">
                    Engagement {renderSortIcon('engagementRate')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('viralityScore')}
                >
                  <div className="flex items-center gap-1">
                    Virality {renderSortIcon('viralityScore')}
                  </div>
                </TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map((content) => (
                <TableRow 
                  key={content.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleContentClick(content)}
                >
                  <TableCell>
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <img 
                        src={content.thumbnail} 
                        alt="Content thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={content.platform === 'tiktok' ? 'default' : 'secondary'}>
                          {content.platform.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">@{content.creator}</span>
                      </div>
                      <p className="text-sm font-medium line-clamp-2">{content.caption}</p>
                      <div className="flex gap-1 mt-1">
                        {content.hashtags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(content.metrics.views)}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(content.metrics.likes)}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{content.metrics.engagementRate.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{content.metrics.viralityScore}</span>
                      {renderPerformanceBadge(content.metrics.viralityScore)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleContentClick(content)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => sendToCRM(content)}>
                          Send to CRM
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Open Original
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Content Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedContent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Content Analysis
                  <Badge variant={selectedContent.platform === 'tiktok' ? 'default' : 'secondary'}>
                    {selectedContent.platform.toUpperCase()}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video Preview */}
                <div>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Play className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to play video</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold mb-1">Caption</h4>
                      <p className="text-sm">{selectedContent.caption}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-1">Creator</h4>
                      <p className="text-sm">@{selectedContent.creator}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-1">Hashtags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedContent.hashtags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Metrics Panel */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Eye className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-bold">{formatNumber(selectedContent.metrics.views)}</div>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Heart className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-bold">{formatNumber(selectedContent.metrics.likes)}</div>
                        <p className="text-xs text-muted-foreground">Likes</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <MessageCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-bold">{formatNumber(selectedContent.metrics.comments)}</div>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Share className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-bold">{formatNumber(selectedContent.metrics.shares)}</div>
                        <p className="text-xs text-muted-foreground">Shares</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Engagement Rate</span>
                          <span className="font-medium">{selectedContent.metrics.engagementRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Virality Score</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedContent.metrics.viralityScore}</span>
                            {renderPerformanceBadge(selectedContent.metrics.viralityScore)}
                          </div>
                        </div>
                        {selectedContent.duration && (
                          <div className="flex justify-between">
                            <span className="text-sm">Duration</span>
                            <span className="font-medium">{selectedContent.duration}s</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => sendToCRM(selectedContent)} 
                      className="flex-1"
                    >
                      Send to CRM
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={selectedContent.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Original
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}