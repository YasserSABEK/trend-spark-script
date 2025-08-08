import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink } from 'lucide-react';

interface TikTokEmbedProps {
  url: string;
  className?: string;
  thumbnailUrl?: string;
}

export const TikTokEmbed: React.FC<TikTokEmbedProps> = ({ 
  url, 
  className = "",
  thumbnailUrl
}) => {
  const handleClick = () => {
    window.open(url, '_blank');
  };

  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={handleClick}>
      <div className="aspect-[9/16] w-full overflow-hidden rounded-xl bg-muted">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
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
          >
            <Play className="w-6 h-6 mr-2" />
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};