import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageSquare, 
  Play, 
  Clock, 
  Zap,
  Eye,
  ExternalLink
} from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { useState } from "react";

interface InstagramReel {
  id: string;
  post_id: string;
  url: string;
  caption: string;
  hashtags: string[];
  username: string;
  display_name: string;
  followers: number;
  verified: boolean;
  likes: number;
  comments: number;
  video_view_count: number;
  viral_score: number;
  engagement_rate: number;
  timestamp: string;
  scraped_at: string;
  thumbnail_url: string;
  video_url?: string;
}

interface ReelCardProps {
  reel: InstagramReel;
  onGenerateScript?: () => void;
}

export const ReelCard = ({ reel, onGenerateScript }: ReelCardProps) => {
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const posted = new Date(timestamp);
    const diff = now.getTime() - posted.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const openInstagramPost = () => {
    window.open(reel.url, '_blank');
  };

  const handlePlayVideo = () => {
    if (reel.video_url) {
      setShowVideoPlayer(true);
    } else {
      openInstagramPost();
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
      {/* Video Thumbnail */}
      <div 
        className="aspect-[9/16] bg-gradient-to-br from-instagram-pink/20 via-instagram-purple/20 to-instagram-orange/20 flex items-center justify-center relative overflow-hidden"
        onClick={handlePlayVideo}
      >
        {reel.thumbnail_url ? (
          <>
            <img 
              src={reel.thumbnail_url} 
              alt="Reel thumbnail"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              style={{ opacity: '0', transition: 'opacity 0.3s' }}
              onLoad={(e) => {
                const target = e.currentTarget;
                target.style.opacity = '1';
              }}
              onError={(e) => {
                // Hide broken image and show fallback
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                const fallback = parent?.querySelector('.thumbnail-fallback') as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
            {/* Fallback when thumbnail fails */}
            <div 
              className="thumbnail-fallback absolute inset-0 w-full h-full bg-gradient-to-br from-instagram-pink/30 to-instagram-purple/30 flex items-center justify-center"
              style={{ display: 'none' }}
            >
              <Play className="w-16 h-16 text-white opacity-80" />
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-instagram-pink/30 to-instagram-purple/30 flex items-center justify-center">
            <Play className="w-16 h-16 text-white opacity-80" />
          </div>
        )}
        
        {/* Overlay Elements */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        <div className="absolute top-3 right-3">
          <Badge className="bg-gradient-to-r from-instagram-pink to-instagram-purple text-white">
            {reel.viral_score}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-black/60 text-white border-none">
            <Clock className="w-3 h-3 mr-1" />
            {getTimeAgo(reel.timestamp)}
          </Badge>
        </div>
        <div className="absolute center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {reel.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm">@{reel.username}</p>
              {reel.verified && (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(reel.followers)} followers
            </p>
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm mb-3 line-clamp-3 leading-relaxed">{reel.caption}</p>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {reel.hashtags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {reel.hashtags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{reel.hashtags.length - 3}
            </Badge>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Heart className="w-4 h-4 text-red-500" />
              {formatNumber(reel.likes)}
            </div>
            <span className="text-xs text-muted-foreground">Likes</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-medium">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              {formatNumber(reel.comments)}
            </div>
            <span className="text-xs text-muted-foreground">Comments</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Eye className="w-4 h-4 text-green-500" />
              {formatNumber(reel.video_view_count)}
            </div>
            <span className="text-xs text-muted-foreground">Views</span>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="flex justify-between items-center mb-4">
          <Badge variant="outline" className="text-xs">
            {reel.engagement_rate}% ER
          </Badge>
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
            Viral Score: {reel.viral_score}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 bg-gradient-to-r from-instagram-pink to-instagram-purple hover:opacity-90"
            onClick={onGenerateScript}
          >
            <Zap className="w-4 h-4 mr-2" />
            Generate Script
          </Button>
          <Button size="sm" variant="outline" onClick={openInstagramPost}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      <VideoPlayer
        isOpen={showVideoPlayer}
        onClose={() => setShowVideoPlayer(false)}
        videoUrl={reel.video_url || ''}
        thumbnailUrl={reel.thumbnail_url || ''}
        title={reel.caption}
        instagramUrl={reel.url}
      />
    </Card>
  );
};