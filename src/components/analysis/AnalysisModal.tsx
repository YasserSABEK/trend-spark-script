import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Link as LinkIcon, 
  Copy, 
  Send,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCredits } from '@/hooks/useCredits';

interface ContentItem {
  id: string;
  platform: string;
  source_url: string;
  caption: string | null;
}

interface AnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentItem: ContentItem | null;
  onSendToGenerator?: (hook: string, insights: any) => void;
}

interface Analysis {
  id: string;
  status: string;
  hook_text: string | null;
  sections: any[] | null;
  insights: any | null;
  transcript: string | null;
  credits_used: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export function AnalysisModal({ open, onOpenChange, contentItem, onSendToGenerator }: AnalysisModalProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [deeperAnalysis, setDeeperAnalysis] = useState(false);
  const { credits, hasCredits } = useCredits();

  useEffect(() => {
    if (open && contentItem) {
      checkExistingAnalysis();
    }
  }, [open, contentItem]);

  const checkExistingAnalysis = async () => {
    if (!contentItem) return;

    try {
      // Direct query to content_analysis table (bypassing type issues)
      const { data, error } = await supabase
        .from('content_analysis' as any)
        .select('*')
        .eq('content_item_id', contentItem.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('No existing analysis found:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const analysisData = data[0] as any;
        setAnalysis({
          id: analysisData.id,
          status: analysisData.status,
          hook_text: analysisData.hook_text,
          sections: analysisData.sections,
          insights: analysisData.insights,
          transcript: analysisData.transcript,
          credits_used: analysisData.credits_used,
          error_message: analysisData.error_message,
          created_at: analysisData.created_at,
          completed_at: analysisData.completed_at
        });
        
        if (analysisData.status === 'transcribing' || analysisData.status === 'analyzing') {
          pollAnalysisStatus(analysisData.id);
        }
      }
    } catch (error) {
      console.error('Error checking existing analysis:', error);
    }
  };

  const pollAnalysisStatus = async (analysisId: string) => {
    const interval = setInterval(async () => {
      try {
        // Direct query to content_analysis table (bypassing type issues)
        const { data, error } = await supabase
          .from('content_analysis' as any)
          .select('*')
          .eq('id', analysisId)
          .single();

        if (error) {
          console.error('Polling error:', error);
          return;
        }

        if (data) {
          const analysisData = data as any;
          const updatedAnalysis = {
            id: analysisData.id,
            status: analysisData.status,
            hook_text: analysisData.hook_text,
            sections: analysisData.sections,
            insights: analysisData.insights,
            transcript: analysisData.transcript,
            credits_used: analysisData.credits_used,
            error_message: analysisData.error_message,
            created_at: analysisData.created_at,
            completed_at: analysisData.completed_at
          };
          
          setAnalysis(updatedAnalysis);

          if (analysisData.status === 'completed' || analysisData.status === 'failed') {
            clearInterval(interval);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error polling analysis status:', error);
        clearInterval(interval);
        setLoading(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const startAnalysis = async (videoUrl?: string) => {
    if (!contentItem) return;

    const creditsNeeded = deeperAnalysis ? 2 : 1;
    if (!hasCredits(creditsNeeded)) {
      toast.error(`You need ${creditsNeeded} credits to analyze this content`);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: {
          contentItemId: contentItem.id,
          videoUrl,
          deeperAnalysis
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Analysis started! This may take a few minutes.');
        checkExistingAnalysis();
        pollAnalysisStatus(data.analysisId);
      } else {
        throw new Error(data?.error || 'Failed to start analysis');
      }
    } catch (error: any) {
      console.error('Error starting analysis:', error);
      toast.error('Failed to start analysis: ' + error.message);
      setLoading(false);
    }
  };

  const handleTikTokAnalysis = async () => {
    if (!contentItem || contentItem.platform !== 'tiktok') return;
    
    setLoading(true);
    try {
      // For TikTok, let the backend handle video URL lookup
      await startAnalysis();
    } catch (error) {
      console.error('TikTok analysis error:', error);
      toast.error("Failed to analyze TikTok content");
      setLoading(false);
    }
  };

  const handleUploadAnalysis = async () => {
    if (!uploadUrl.trim()) {
      toast.error('Please provide a video URL');
      return;
    }

    if (!uploadUrl.includes('.mp4') && !uploadUrl.includes('.mov') && !uploadUrl.includes('.webm')) {
      toast.error('Please provide a direct video file URL (mp4, mov, webm)');
      return;
    }

    await startAnalysis(uploadUrl);
  };

  const copyHook = () => {
    if (analysis?.hook_text) {
      navigator.clipboard.writeText(analysis.hook_text);
      toast.success('Hook copied to clipboard');
    }
  };

  const sendToGenerator = () => {
    if (analysis?.hook_text && onSendToGenerator) {
      onSendToGenerator(analysis.hook_text, analysis.insights);
      onOpenChange(false);
      toast.success('Sent to Script Generator');
    }
  };

  const getStatusDisplay = () => {
    if (!analysis) return null;

    const statusConfig = {
      queued: { label: 'Queued', color: 'secondary', icon: Loader2 },
      transcribing: { label: 'Transcribing', color: 'secondary', icon: Loader2 },
      analyzing: { label: 'Analyzing', color: 'secondary', icon: Loader2 },
      completed: { label: 'Completed', color: 'default', icon: CheckCircle },
      failed: { label: 'Failed', color: 'destructive', icon: AlertCircle }
    };

    const config = statusConfig[analysis.status as keyof typeof statusConfig] || statusConfig.queued;
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <Badge variant={config.color as any}>{config.label}</Badge>
        {(analysis.status === 'transcribing' || analysis.status === 'analyzing') && (
          <Progress value={analysis.status === 'transcribing' ? 30 : 70} className="w-24" />
        )}
      </div>
    );
  };

  if (!contentItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Content Analysis</DialogTitle>
        </DialogHeader>

        {!analysis && (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Credit Cost:</p>
              <ul className="space-y-1">
                <li>• ≤90 seconds: 1 credit</li>
                <li>• 91-180 seconds: 2 credits</li>
                <li>• Deeper analysis: +1 credit</li>
              </ul>
            </div>

            <div className="space-y-4">
              <p>Analyze this {contentItem.platform} content with AI-powered insights:</p>
              <Button 
                onClick={contentItem.platform === 'tiktok' ? handleTikTokAnalysis : () => startAnalysis()}
                disabled={loading || !hasCredits(deeperAnalysis ? 2 : 1)}
                className="w-full"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {contentItem.platform === 'instagram' ? 'Analyze Instagram Video' : 'Analyze TikTok Video'} ({deeperAnalysis ? 2 : 1} credit{deeperAnalysis ? 's' : ''})
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="deeper"
                checked={deeperAnalysis}
                onCheckedChange={(checked) => setDeeperAnalysis(!!checked)}
              />
              <label htmlFor="deeper" className="text-sm">
                Deeper analysis (+1 credit) - More detailed insights and patterns
              </label>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {getStatusDisplay()}
              {analysis.status === 'completed' && (
                <div className="text-sm text-muted-foreground">
                  Last analyzed: {new Date(analysis.created_at).toLocaleDateString()}
                </div>
              )}
            </div>

            {analysis.status === 'failed' && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive font-medium">Analysis Failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {analysis.error_message || 'Unknown error occurred'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setAnalysis(null)}
                >
                  Try Again
                </Button>
              </div>
            )}

            {analysis.status === 'completed' && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="sections">Sections</TabsTrigger>
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Hook (First 3-5 seconds)</h3>
                    <p className="text-sm mb-3">{analysis.hook_text}</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={copyHook}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Hook
                      </Button>
                      <Button size="sm" variant="outline" onClick={sendToGenerator}>
                        <Send className="w-4 h-4 mr-2" />
                        Send to Generator
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Why This Went Viral</h3>
                    <div className="space-y-2 text-sm">
                      {analysis.insights?.viral_analysis?.map((factor: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{factor}</span>
                        </div>
                      )) || <p className="text-muted-foreground">Analysis in progress...</p>}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sections" className="space-y-4">
                  {analysis.sections?.map((section: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{section.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.floor(section.start / 1000)}s - {Math.floor(section.end / 1000)}s
                        </span>
                      </div>
                      <h4 className="font-medium mb-1">{section.headline}</h4>
                      <p className="text-sm text-muted-foreground">{section.summary}</p>
                    </div>
                  )) || <p className="text-muted-foreground">No sections available</p>}
                </TabsContent>

                <TabsContent value="transcript" className="space-y-4">
                  <div className="p-4 border rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {analysis.transcript || 'Transcript not available'}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Key Phrases</h3>
                      <div className="flex flex-wrap gap-1">
                        {analysis.insights?.key_phrases?.map((phrase: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {phrase.text}
                          </Badge>
                        )) || <p className="text-muted-foreground text-sm">No key phrases found</p>}
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Sentiment Analysis</h3>
                      <div className="space-y-2">
                        {analysis.insights?.sentiment?.map((sentiment: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{sentiment.text}</span>
                            <Badge 
                              variant={sentiment.sentiment === 'POSITIVE' ? 'default' : 
                                     sentiment.sentiment === 'NEGATIVE' ? 'destructive' : 'secondary'}
                            >
                              {sentiment.sentiment}
                            </Badge>
                          </div>
                        )) || <p className="text-muted-foreground text-sm">No sentiment data available</p>}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {(loading || analysis.status === 'transcribing' || analysis.status === 'analyzing') && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {analysis.status === 'transcribing' ? 'Transcribing audio...' : 'Analyzing content...'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may take 2-5 minutes depending on video length
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}