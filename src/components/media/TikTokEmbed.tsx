import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TikTokEmbedProps {
  url: string;
  className?: string;
  thumbnailUrl?: string;
}

interface OEmbedData {
  html: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
}

export const TikTokEmbed: React.FC<TikTokEmbedProps> = ({ 
  url, 
  className = "",
  thumbnailUrl
}) => {
  const [embedData, setEmbedData] = useState<OEmbedData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load thumbnail immediately on mount if not provided
  useEffect(() => {
    if (!thumbnailUrl && !embedData && !loading) {
      loadThumbnail();
    }
  }, [thumbnailUrl, embedData, loading]);

  const loadThumbnail = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-oembed', {
        body: { url }
      });

      if (error) throw error;
      
      setEmbedData(data);
    } catch (error) {
      console.error('Error loading TikTok thumbnail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    // Always open TikTok directly
    window.open(url, '_blank');
  };

  // Show thumbnail immediately
  const displayThumbnail = thumbnailUrl || embedData?.thumbnail_url;

  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={handleClick}>
      <div className="aspect-[9/16] w-full overflow-hidden rounded-xl bg-muted">
        {displayThumbnail ? (
          <img 
            src={displayThumbnail} 
            alt="TikTok video thumbnail"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : loading ? (
          <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
            <div className="text-muted-foreground text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Loading thumbnail...</p>
            </div>
          </div>
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
          >
            <ExternalLink className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};