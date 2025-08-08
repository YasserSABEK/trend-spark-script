import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TikTokEmbedProps {
  url: string;
  autoplay?: boolean;
  className?: string;
  thumbnailUrl?: string;
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
  className = "",
  thumbnailUrl
}) => {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [oembedData, setOembedData] = useState<OEmbedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isPlaying || oembedData) {
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use Supabase client to call the edge function
      const { data, error: functionError } = await supabase.functions.invoke('tiktok-oembed', {
        body: { url }
      });

      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }

      // Check if the response indicates failure
      if (data?.success === false) {
        // If oEmbed failed, open in new tab as fallback
        if (data.fallback_url) {
          window.open(data.fallback_url, '_blank');
          return;
        }
        throw new Error(data.error || 'Failed to load video');
      }

      setOembedData(data);
      setIsPlaying(true);

      // Ensure TikTok embed script is loaded and initialize
      setTimeout(() => {
        if (typeof (window as any).tiktokEmbedLoad === 'function') {
          (window as any).tiktokEmbedLoad();
        } else if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
          const script = document.createElement('script');
          script.src = 'https://www.tiktok.com/embed.js';
          script.async = true;
          document.head.appendChild(script);
        }
      }, 100);

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
      <div className={`aspect-[9/16] w-full overflow-hidden rounded-xl ${className}`}>
        <div 
          className="tiktok-embed w-full h-full"
          dangerouslySetInnerHTML={{ __html: oembedData.html }}
        />
      </div>
    );
  }

  return (
    <div className={`relative group cursor-pointer ${className}`}>
      <div className="aspect-[9/16] w-full overflow-hidden rounded-xl bg-muted">
        {oembedData?.thumbnail_url || thumbnailUrl ? (
          <img 
            src={oembedData?.thumbnail_url || thumbnailUrl!} 
            alt="TikTok video thumbnail"
            className="h-full w-full object-cover"
            loading="lazy"
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
            className="bg-white/90 hover:bg-white text-black pointer-events-auto z-10"
            disabled={isLoading}
            onClick={handlePlay}
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