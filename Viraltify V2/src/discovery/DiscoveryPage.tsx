import React, { useState, useCallback } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface ProfileResult {
  id: string;
  platform: 'tiktok' | 'instagram';
  username: string;
  displayName: string;
  thumbnail: string;
  followerCount: number;
  totalPosts: number;
  scrapedPosts: number;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
}

type ScrapeStatus = 'idle' | 'validating' | 'scraping' | 'polling' | 'complete' | 'error';

export function DiscoveryPage() {
  // State management
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<'tiktok' | 'instagram'>('tiktok');
  const [postCount, setPostCount] = useState('20');
  const [status, setStatus] = useState<ScrapeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [progress, setProgress] = useState(0);

  // URL validation
  const validateUrl = useCallback((inputUrl: string) => {
    const tiktokPattern = /^https?:\/\/(www\.)?(tiktok\.com\/@[\w.-]+|tiktok\.com\/t\/)/;
    const instagramPattern = /^https?:\/\/(www\.)?(instagram\.com\/[\w.-]+|instagr\.am\/)/;
    
    if (platform === 'tiktok' && !tiktokPattern.test(inputUrl)) {
      return 'Please enter a valid TikTok profile URL (e.g., https://tiktok.com/@username)';
    }
    
    if (platform === 'instagram' && !instagramPattern.test(inputUrl)) {
      return 'Please enter a valid Instagram profile URL (e.g., https://instagram.com/username)';
    }
    
    return null;
  }, [platform]);

  // Auto-detect platform from URL
  const detectPlatform = useCallback((inputUrl: string) => {
    if (inputUrl.includes('tiktok.com')) {
      setPlatform('tiktok');
    } else if (inputUrl.includes('instagram.com')) {
      setPlatform('instagram');
    }
  }, []);

  // Handle URL input changes
  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError(null);
    
    if (value.trim()) {
      detectPlatform(value);
    }
  };

  // Main scraping function
  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a profile URL');
      return;
    }

    setStatus('validating');
    const validationError = validateUrl(url);
    
    if (validationError) {
      setError(validationError);
      setStatus('idle');
      return;
    }

    try {
      setStatus('scraping');
      setError(null);
      setProgress(10);

      // Simulate API call to scraping service
      // In real implementation, this would call the appropriate Edge Function
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          platform,
          postCount: parseInt(postCount)
        })
      });

      if (!response.ok) {
        throw new Error('Scraping failed');
      }

      const { jobId } = await response.json();
      setProgress(30);

      // Poll for results
      setStatus('polling');
      await pollForResults(jobId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    }
  };

  // Poll for scraping completion
  const pollForResults = async (jobId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/scrape/status/${jobId}`);
        const data = await response.json();

        setProgress(30 + (attempts / maxAttempts) * 60);

        if (data.status === 'completed') {
          setResults(data.results);
          setStatus('complete');
          setProgress(100);
          return;
        }

        if (data.status === 'failed') {
          throw new Error(data.error || 'Scraping failed');
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          throw new Error('Scraping timeout');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Polling failed');
        setStatus('error');
      }
    };

    poll();
  };

  // Render loading state
  const renderLoadingState = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <h3 className="text-lg font-semibold mb-2">
          {status === 'validating' && 'Validating URL...'}
          {status === 'scraping' && 'Starting scrape...'}
          {status === 'polling' && 'Collecting content...'}
        </h3>
        <p className="text-muted-foreground mb-4">
          This may take a few minutes depending on the profile size
        </p>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
      </CardContent>
    </Card>
  );

  // Render profile result card
  const renderProfileCard = (profile: ProfileResult) => (
    <Card key={profile.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant={profile.platform === 'tiktok' ? 'default' : 'secondary'}>
            {profile.platform.toUpperCase()}
          </Badge>
          <Badge variant={profile.status === 'completed' ? 'default' : 'secondary'}>
            {profile.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {profile.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-3 mb-4">
          <img 
            src={profile.thumbnail} 
            alt={profile.displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold">{profile.displayName}</h3>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Followers</p>
            <p className="font-semibold">{profile.followerCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Posts Scraped</p>
            <p className="font-semibold">{profile.scrapedPosts} / {profile.totalPosts}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1">
            Refresh
          </Button>
          <Button size="sm" className="flex-1">
            View Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Discover Viral Content</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Enter any TikTok or Instagram profile URL to scrape and analyze their viral content
        </p>
      </div>

      {/* Main Search Interface */}
      <Card className="w-full max-w-2xl mx-auto mb-8">
        <CardContent className="p-6">
          {/* Platform Selector */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={platform === 'tiktok' ? 'default' : 'outline'}
              onClick={() => setPlatform('tiktok')}
              className="flex-1"
            >
              TikTok
            </Button>
            <Button
              variant={platform === 'instagram' ? 'default' : 'outline'}
              onClick={() => setPlatform('instagram')}
              className="flex-1"
            >
              Instagram
            </Button>
          </div>

          {/* URL Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Enter ${platform} profile URL...`}
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="pl-10"
              disabled={status === 'scraping' || status === 'polling'}
            />
          </div>

          {/* Post Count Selector */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Number of Posts</label>
              <Select value={postCount} onValueChange={setPostCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 posts</SelectItem>
                  <SelectItem value="20">20 posts</SelectItem>
                  <SelectItem value="50">50 posts</SelectItem>
                  <SelectItem value="100">100 posts</SelectItem>
                  <SelectItem value="1000">1000 posts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Scrape Button */}
          <Button 
            onClick={handleScrape}
            className="w-full"
            disabled={status === 'scraping' || status === 'polling' || !url.trim()}
          >
            {(status === 'scraping' || status === 'polling') && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Scrape Profile
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {(status === 'validating' || status === 'scraping' || status === 'polling') && renderLoadingState()}

      {/* Results Grid */}
      {results.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Scraped Profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map(renderProfileCard)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {status === 'idle' && results.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to discover viral content?</h3>
            <p className="text-muted-foreground mb-4">
              Enter a profile URL above to start scraping and analyzing viral content.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm">
                Try TikTok Example
              </Button>
              <Button variant="outline" size="sm">
                Try Instagram Example
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}