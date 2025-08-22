import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play } from "lucide-react";

interface SimpleInstagramPreviewProps {
  url: string;
  className?: string;
  thumbnailUrl?: string;
  caption?: string;
}

/**
 * Simple Instagram preview component for minimal use cases
 * Shows thumbnail + link without complex embed logic
 */
export const SimpleInstagramPreview: React.FC<SimpleInstagramPreviewProps> = ({
  url,
  className = "",
  thumbnailUrl,
  caption
}) => {
  const openInstagram = () => {
    window.open(url, '_blank');
  };

  return (
    <div className={`relative cursor-pointer group ${className}`} onClick={openInstagram}>
      <div className="w-full h-full bg-gradient-to-br from-instagram-pink/10 via-instagram-purple/10 to-instagram-orange/10 rounded-lg overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={caption || "Instagram post"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-instagram-pink/20 to-instagram-purple/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 text-white text-sm font-medium">
            <ExternalLink className="w-4 h-4" />
            View on Instagram
          </div>
        </div>
      </div>
      
      {caption && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
          {caption}
        </p>
      )}
    </div>
  );
};