import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Video, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoSample {
  id: string;
  source_url: string;
  thumbnail_url?: string;
  caption?: string;
  platform: string;
  status: string;
  created_at: string;
  analysis?: {
    transcript?: string;
    hook_text?: string;
    status?: string;
    video_duration?: number;
  };
}

interface VideoSampleDisplayProps {
  samples: VideoSample[];
  title?: string;
  showTranscripts?: boolean;
}

export const VideoSampleDisplay: React.FC<VideoSampleDisplayProps> = ({
  samples,
  title = "Video Samples",
  showTranscripts = true
}) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing': return 'Processing...';
      case 'completed': return 'Analyzed';
      case 'failed': return 'Failed';
      default: return 'Queued';
    }
  };

  if (samples.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No video samples yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          {title} ({samples.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {samples.map((sample) => (
          <Card key={sample.id} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {sample.platform}
                  </Badge>
                  <Badge 
                    variant={getStatusColor(sample.analysis?.status || sample.status)}
                    className="text-xs"
                  >
                    {getStatusText(sample.analysis?.status || sample.status)}
                  </Badge>
                  {sample.analysis?.video_duration && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(sample.analysis.video_duration)}
                    </Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(sample.source_url, '_blank')}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              
              {sample.caption && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {sample.caption}
                </p>
              )}
            </CardHeader>

            {showTranscripts && sample.analysis?.transcript && (
              <>
                <Separator />
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {sample.analysis.hook_text && (
                      <div>
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          Hook
                        </h5>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">
                          "{sample.analysis.hook_text}"
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2">Full Transcript</h5>
                      <div className="max-h-32 overflow-y-auto">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {sample.analysis.transcript}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {sample.analysis?.status === 'processing' && (
              <>
                <Separator />
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-gray-600"></div>
                    Analyzing transcript...
                  </div>
                </CardContent>
              </>
            )}

            {sample.analysis?.status === 'failed' && (
              <>
                <Separator />
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">
                    Analysis failed. Please try uploading the video again.
                  </p>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};