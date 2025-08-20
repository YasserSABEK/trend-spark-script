import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface VideoUploadStepProps {
  profileId: string;
  onProcessingComplete: (results: any) => void;
  onProcessingStart: () => void;
}

interface VideoItem {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  transcriptId?: string;
}

const VideoUploadStep: React.FC<VideoUploadStepProps> = ({
  profileId,
  onProcessingComplete,
  onProcessingStart
}) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount and visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isProcessing) {
        // Pause polling when tab is hidden to prevent crashes
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (!document.hidden && isProcessing && !pollIntervalRef.current) {
        // Resume polling when tab becomes visible
        // Note: This would need the processedVideos to be stored in state to resume properly
        console.log('Tab became visible during processing - polling may need manual restart');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isProcessing]);

  const validateInstagramUrl = (url: string): boolean => {
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+\/?/;
    return instagramRegex.test(url);
  };

  const addVideo = () => {
    if (!currentUrl.trim()) return;

    if (!validateInstagramUrl(currentUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Instagram reel or post URL",
        variant: "destructive",
      });
      return;
    }

    const isDuplicate = videos.some(video => video.url === currentUrl);
    if (isDuplicate) {
      toast({
        title: "Duplicate URL",
        description: "This video has already been added",
        variant: "destructive",
      });
      return;
    }

    if (videos.length >= 10) {
      toast({
        title: "Maximum videos reached",
        description: "You can add up to 10 videos for analysis",
        variant: "destructive",
      });
      return;
    }

    const newVideo: VideoItem = {
      id: Date.now().toString(),
      url: currentUrl,
      status: 'pending'
    };

    setVideos(prev => [...prev, newVideo]);
    setCurrentUrl('');
  };

  const removeVideo = (id: string) => {
    setVideos(prev => prev.filter(video => video.id !== id));
  };

  const startTranscription = async () => {
    if (videos.length === 0) {
      toast({
        title: "No videos added",
        description: "Please add at least one video to transcribe",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    onProcessingStart();

    try {
      const videoUrls = videos.map(video => video.url);
      
      // Update all videos to processing status
      setVideos(prev => prev.map(video => ({
        ...video,
        status: 'processing' as const
      })));

      const { data, error } = await supabase.functions.invoke('process-profile-videos', {
        body: {
          videoUrls,
          profileId
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to start video processing');
      }

      if (!data.success) {
        throw new Error(data.error || 'Video processing failed');
      }

      // Update video statuses based on results
      setVideos(prev => prev.map(video => {
        const processedVideo = data.processedVideos.find((pv: any) => pv.videoUrl === video.url);
        const errorVideo = data.errors.find((ev: any) => ev.videoUrl === video.url);

        if (processedVideo) {
          return {
            ...video,
            status: 'processing' as const,
            transcriptId: processedVideo.transcriptId
          };
        } else if (errorVideo) {
          return {
            ...video,
            status: 'error' as const,
            error: errorVideo.error
          };
        }
        return video;
      }));

      // Start polling for completion
      if (data.processedVideos.length > 0) {
        pollForCompletion(data.processedVideos);
      } else {
        setIsProcessing(false);
        toast({
          title: "Processing Failed",
          description: "No videos could be processed. Please check your URLs and try again.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Transcription error:', error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: error.message || "Failed to start transcription",
        variant: "destructive",
      });
    }
  };

  const pollForCompletion = async (processedVideos: any[]) => {
    // Clear any existing intervals
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    pollIntervalRef.current = setInterval(async () => {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        return;
      }

      try {
        let completedCount = 0;
        let totalCount = processedVideos.length;

        // Check status of each analysis
        for (const processedVideo of processedVideos) {
          const { data, error } = await supabase
            .from('content_analysis')
            .select('status, error_message')
            .eq('id', processedVideo.analysisId)
            .single();

          if (data) {
            if (data.status === 'completed') {
              completedCount++;
              if (isMountedRef.current) {
                setVideos(prev => prev.map(video => 
                  video.url === processedVideo.videoUrl 
                    ? { ...video, status: 'completed' as const }
                    : video
                ));
              }
            } else if (data.status === 'failed') {
              if (isMountedRef.current) {
                setVideos(prev => prev.map(video => 
                  video.url === processedVideo.videoUrl 
                    ? { 
                        ...video, 
                        status: 'error' as const, 
                        error: data.error_message || 'Transcription failed'
                      }
                    : video
                ));
              }
            }
          }
        }

        const progress = (completedCount / totalCount) * 100;
        if (isMountedRef.current) {
          setProcessingProgress(progress);
        }

        // Check if all are completed or failed
        if (completedCount === totalCount) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          if (isMountedRef.current) {
            setIsProcessing(false);
            setProcessingProgress(100);
            
            if (completedCount > 0) {
              toast({
                title: "Processing Complete!",
                description: `Successfully transcribed ${completedCount} video(s)`,
              });
              onProcessingComplete({
                totalVideos: totalCount,
                completedVideos: completedCount,
                errors: totalCount - completedCount
              });
            } else {
              toast({
                title: "Processing Failed",
                description: "No videos could be transcribed successfully",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (isMountedRef.current) {
          toast({
            title: "Processing Error",
            description: "Error checking video processing status",
            variant: "destructive",
          });
        }
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup after 5 minutes
    timeoutRef.current = setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (isMountedRef.current) {
        setIsProcessing(false);
        toast({
          title: "Processing Timeout",
          description: "Video processing took longer than expected. Please check back later.",
          variant: "destructive",
        });
      }
    }, 300000);
  };

  const getVideoStatusIcon = (status: VideoItem['status']) => {
    switch (status) {
      case 'pending':
        return <Play className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getVideoStatusText = (video: VideoItem) => {
    switch (video.status) {
      case 'pending':
        return 'Ready to transcribe';
      case 'processing':
        return 'Transcribing...';
      case 'completed':
        return 'Transcription complete';
      case 'error':
        return video.error || 'Transcription failed';
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="video-url" className="text-base font-medium">
            Add Instagram Videos for Analysis
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Add Instagram reels or posts to analyze your content style. Maximum 3 minutes per video.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            id="video-url"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addVideo()}
            disabled={isProcessing}
          />
          <Button 
            onClick={addVideo} 
            variant="outline" 
            size="icon"
            disabled={isProcessing}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {videos.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            {videos.map((video, index) => (
              <Card key={video.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getVideoStatusIcon(video.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Video {index + 1}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getVideoStatusText(video)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        video.status === 'completed' ? 'default' : 
                        video.status === 'error' ? 'destructive' : 
                        video.status === 'processing' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {video.status}
                    </Badge>
                    
                    {!isProcessing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeVideo(video.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing videos...</span>
                <span className="font-medium">{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                Please wait while we transcribe your videos. This may take a few minutes.
              </p>
            </div>
          )}

          {!isProcessing && videos.length > 0 && (
            <Button 
              onClick={startTranscription} 
              className="w-full"
              disabled={videos.every(video => video.status === 'completed')}
            >
              <Play className="h-4 w-4 mr-2" />
              Transcribe Videos ({videos.filter(v => v.status === 'pending' || v.status === 'error').length})
            </Button>
          )}
        </div>
      )}

      {videos.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Add Your Content</h3>
          <p className="text-muted-foreground mb-4">
            Add Instagram videos to analyze your style and create personalized scripts
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Maximum 10 videos</p>
            <p>• 3 minutes maximum per video</p>
            <p>• Instagram reels and posts supported</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadStep;