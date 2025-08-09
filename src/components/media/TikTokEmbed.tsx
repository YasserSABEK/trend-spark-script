import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink } from 'lucide-react';
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadEmbed = async () => {
    if (loading || isLoaded) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-oembed', {
        body: { url }
      });

      if (error) throw error;
      
      setEmbedData(data);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading TikTok embed:', error);
      // Fallback to opening in new tab
      window.open(url, '_blank');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (!isLoaded && !loading) {
      loadEmbed();
    } else {
      window.open(url, '_blank');
    }
  };

  // Always show clickable thumbnail first, don't auto-load embed
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
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
            <div className="text-white text-center">
              <Play className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">TikTok Video</p>
            </div>
          </div>
        )}

        {/* Play/Load overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
          <Button
            variant="secondary"
            size="lg"
            className="bg-white/90 hover:bg-white text-black pointer-events-auto z-10"
            disabled={loading}
          >
            <Play className="w-6 h-6 mr-2" />
            {loading ? 'Loading...' : <ExternalLink className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};