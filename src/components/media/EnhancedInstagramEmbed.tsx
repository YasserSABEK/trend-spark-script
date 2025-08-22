import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play, Heart, MessageSquare, Eye, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EnhancedInstagramEmbedProps {
  url: string;
  className?: string;
  title?: string;
  thumbnailUrl?: string;
  caption?: string;
  username?: string;
  displayName?: string;
  likes?: number | null;
  comments?: number | null;
  videoViewCount?: number | null;
  timestamp?: string;
  verified?: boolean;
  fallbackOnly?: boolean;
}

type EmbedState = 'loading' | 'embed' | 'fallback' | 'error';

function buildEmbedUrl(inputUrl: string): string {
  try {
    const u = new URL(inputUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const type = parts[0];
      const id = parts[1];
      if (["reel", "p", "tv"].includes(type)) {
        u.pathname = `/${type}/${id}/embed`;
        u.searchParams.set('utm_source', 'ig_embed');
        u.searchParams.set('utm_campaign', 'loading');
      }
    }
    u.protocol = "https:";
    u.host = "www.instagram.com";
    return u.toString();
  } catch {
    return inputUrl;
  }
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getTimeAgo(timestamp: string): string {
  if (!timestamp) return '';
  
  try {
    const now = new Date();
    const posted = new Date(timestamp);
    const diff = now.getTime() - posted.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}

export const EnhancedInstagramEmbed: React.FC<EnhancedInstagramEmbedProps> = ({
  url,
  className = "",
  title = "Instagram post",
  thumbnailUrl,
  caption,
  username,
  displayName,
  likes,
  comments,
  videoViewCount,
  timestamp,
  verified,
  fallbackOnly = false
}) => {
  const [embedState, setEmbedState] = useState<EmbedState>(fallbackOnly ? 'fallback' : 'loading');
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (fallbackOnly) {
      setEmbedState('fallback');
      return;
    }

    setEmbedUrl(buildEmbedUrl(url));
    setEmbedState('loading');

    // Set timeout to fallback after 5 seconds
    timeoutRef.current = setTimeout(() => {
      if (embedState === 'loading') {
        setEmbedState('fallback');
      }
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [url, fallbackOnly]);

  const handleIframeLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Check if iframe loaded successfully
    try {
      const iframe = iframeRef.current;
      if (iframe) {
        // Try to detect if the embed loaded properly
        setTimeout(() => {
          setEmbedState('embed');
        }, 1000);
      }
    } catch {
      setEmbedState('fallback');
    }
  };

  const handleIframeError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setEmbedState('fallback');
  };

  const openInstagram = () => {
    window.open(url, '_blank');
  };

  // Loading State
  if (embedState === 'loading') {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full bg-gradient-to-br from-instagram-pink/10 via-instagram-purple/10 to-instagram-orange/10 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        {/* Hidden iframe for loading detection */}
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="encrypted-media; clipboard-write"
          frameBorder={0}
          scrolling="no"
        />
      </div>
    );
  }

  // Successful Embed State
  if (embedState === 'embed' && embedUrl) {
    return (
      <div className={`relative ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          className="w-full h-full rounded-lg bg-muted"
          allowTransparency
          allow="encrypted-media; clipboard-write"
          frameBorder={0}
          scrolling="no"
        />
      </div>
    );
  }

  // Fallback State - Enhanced Card Display
  return (
    <div className={`relative ${className}`}>
      <Card className="w-full h-full bg-gradient-to-br from-instagram-pink/10 via-instagram-purple/10 to-instagram-orange/10 border-0 flex flex-col">
        {/* Thumbnail Area */}
        <div className="flex-1 relative overflow-hidden rounded-t-lg">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={title}
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
          
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={openInstagram}>
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-gray-800 ml-1" />
            </div>
          </div>

          {/* Time Badge */}
          {timestamp && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-black/60 text-white border-none text-xs">
                {getTimeAgo(timestamp)}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-3 space-y-2">
          {/* Creator Info */}
          {username && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {username.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs">@{username}</span>
                {verified && (
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-[10px]">✓</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caption */}
          {caption && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {caption}
            </p>
          )}

          {/* Stats */}
          {(likes || comments || videoViewCount) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {likes !== null && likes !== undefined && (
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  <span>{formatNumber(likes)}</span>
                </div>
              )}
              {comments !== null && comments !== undefined && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-blue-500" />
                  <span>{formatNumber(comments)}</span>
                </div>
              )}
              {videoViewCount !== null && videoViewCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-green-500" />
                  <span>{formatNumber(videoViewCount)}</span>
                </div>
              )}
            </div>
          )}

          {/* View on Instagram Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openInstagram}
            className="w-full text-xs border-instagram-pink/20 hover:bg-instagram-pink/10 hover:border-instagram-pink/40"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View on Instagram
          </Button>

          {/* Embed Failed Notice */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            <span>Embed unavailable</span>
          </div>
        </div>
      </Card>
    </div>
  );
};