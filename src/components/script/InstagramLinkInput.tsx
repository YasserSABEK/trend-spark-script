import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Link, CheckCircle, AlertCircle } from 'lucide-react';

interface InstagramLinkInputProps {
  onScriptExtracted: (script: string) => void;
}

export const InstagramLinkInput: React.FC<InstagramLinkInputProps> = ({ onScriptExtracted }) => {
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const isValidInstagramUrl = (url: string) => {
    const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels)\/[A-Za-z0-9_-]+/;
    return instagramRegex.test(url);
  };

  const handleExtractScript = async () => {
    if (!instagramUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please paste an Instagram video link.",
        variant: "destructive"
      });
      return;
    }

    if (!isValidInstagramUrl(instagramUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please paste a valid Instagram video link (post or reel).",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setStatus('idle');

    try {
      console.log('[InstagramLinkInput] Extracting script from:', instagramUrl);
      
      const { data, error } = await supabase.functions.invoke('extract-and-rewrite-script', {
        body: {
          instagramUrl: instagramUrl.trim()
        }
      });

      if (error) {
        console.error('[InstagramLinkInput] Error:', error);
        
        if (error.message?.includes('INSUFFICIENT_CREDITS')) {
          toast({
            title: "Insufficient Credits",
            description: "You need credits to extract and rewrite scripts.",
            variant: "destructive"
          });
          return;
        }
        
        throw error;
      }

      if (!data || !data.rewrittenScript) {
        throw new Error('No script could be extracted from the video');
      }

      console.log('[InstagramLinkInput] Script extracted successfully');
      
      setStatus('success');
      onScriptExtracted(data.rewrittenScript);
      
      toast({
        title: "Script Extracted!",
        description: "The video has been transcribed and rewritten in your style.",
      });

      // Clear the input after successful extraction
      setInstagramUrl('');

    } catch (error: any) {
      console.error('[InstagramLinkInput] Error extracting script:', error);
      setStatus('error');
      
      const errorMessage = error?.message || 'Failed to extract script from video';
      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Link className="h-4 w-4" />;
    }
  };

  const getHelperText = () => {
    if (isProcessing) {
      return "Extracting script from your video...";
    }
    if (status === 'success') {
      return "Script extracted successfully! You can now generate variations.";
    }
    if (status === 'error') {
      return "Couldn't extract script. Please try a different video.";
    }
    return "We'll extract the transcript and rewrite it in your own style automatically.";
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="instagram-url">Paste Instagram video link</Label>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            {getStatusIcon() && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {getStatusIcon()}
              </div>
            )}
            <Input
              id="instagram-url"
              type="url"
              placeholder="https://www.instagram.com/p/..."
              value={instagramUrl}
              onChange={(e) => {
                setInstagramUrl(e.target.value);
                if (status !== 'idle') setStatus('idle');
              }}
              disabled={isProcessing}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleExtractScript}
            disabled={isProcessing || !instagramUrl.trim()}
            variant="outline"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              'Extract Script'
            )}
          </Button>
        </div>
        <p className={`text-xs ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 
          'text-muted-foreground'
        }`}>
          {getHelperText()}
        </p>
      </div>
    </div>
  );
};