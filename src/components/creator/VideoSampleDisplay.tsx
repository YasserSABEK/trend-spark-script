import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Clock, MessageSquare, ExternalLink, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [expandedSamples, setExpandedSamples] = useState<Set<string>>(new Set());

  const toggleExpanded = (sampleId: string) => {
    const newExpanded = new Set(expandedSamples);
    if (newExpanded.has(sampleId)) {
      newExpanded.delete(sampleId);
    } else {
      newExpanded.add(sampleId);
    }
    setExpandedSamples(newExpanded);
  };
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {title} ({samples.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/analyze'}>
            <Plus className="h-4 w-4 mr-2" />
            Add More Videos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {samples.map((sample) => {
          const isExpanded = expandedSamples.has(sample.id);
          const hasAnalysis = sample.analysis?.transcript || sample.analysis?.hook_text;
          
          return (
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
                  <div className="flex items-center gap-2">
                    {hasAnalysis && showTranscripts && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(sample.id)}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(sample.source_url, '_blank')}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {sample.caption && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {sample.caption}
                  </p>
                )}
              </CardHeader>

              {showTranscripts && hasAnalysis && (
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(sample.id)}>
                  <CollapsibleContent>
                    <Separator />
                    <CardContent className="pt-4">
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="transcript">Full Transcript</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 mt-4">
                          {sample.analysis?.hook_text && (
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <MessageSquare className="h-3 w-3" />
                                Hook (First 3-5 seconds)
                              </h5>
                              <p className="text-sm leading-relaxed">
                                "{sample.analysis.hook_text}"
                              </p>
                            </div>
                          )}
                          
                          {sample.analysis?.transcript && (
                            <div className="p-4 border rounded-lg">
                              <h5 className="font-medium text-sm mb-2">Preview</h5>
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                {sample.analysis.transcript}
                              </p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="transcript" className="space-y-4 mt-4">
                          <div className="p-4 border rounded-lg max-h-64 overflow-y-auto">
                            <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                              {sample.analysis?.transcript || 'Transcript not available'}
                            </pre>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
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
          );
        })}
      </CardContent>
    </Card>
  );
};