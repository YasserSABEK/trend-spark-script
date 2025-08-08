import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TikTokEmbedProps {
  url: string;
  autoplay?: boolean;
  className?: string;
}

interface OEmbedData {
  html: string;
  thumbnail_url: string;
  width: number;
  height: number;
  cached?: boolean;
}

export const TikTokEmbed: React.FC<TikTokEmbedProps> = ({ 
  url, 
  autoplay = false,
  className = ""
}) => {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [oembedData, setOembedData] = useState<OEmbedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlay = async () => {
    if (isPlaying || oembedData) {
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('tiktok-oembed', {
        body: { url }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        // If oEmbed failed, open in new tab as fallback
        if (data.fallback_url) {
          window.open(data.fallback_url, '_blank');
          return;
        }
        throw new Error(data.error);
      }

      setOembedData(data);
      setIsPlaying(true);

      // Ensure TikTok embed script is loaded
      if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        document.head.appendChild(script);
      }

    } catch (err) {
      console.error('TikTok embed error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load video');
      // Fallback: open in new tab
      window.open(url, '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPlaying && oembedData) {
    return (
      <div 
        className={`tiktok-embed ${className}`}
        dangerouslySetInnerHTML={{ __html: oembedData.html }}
      />
    );
  }

  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={handlePlay}>
      {/* Thumbnail or placeholder */}
      <div className="w-full aspect-[9/16] bg-muted rounded-lg overflow-hidden">
        {oembedData?.thumbnail_url ? (
          <img 
            src={oembedData.thumbnail_url} 
            alt="TikTok video thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
            <div className="text-white text-center">
              <Play className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">TikTok Video</p>
            </div>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
          <Button
            variant="secondary"
            size="lg"
            className="bg-white/90 hover:bg-white text-black"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive mt-2">
          {error} - Click to open in new tab
        </p>
      )}
    </div>
  );
};