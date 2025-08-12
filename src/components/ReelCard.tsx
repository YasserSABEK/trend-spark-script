import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageSquare, 
  Play, 
  Clock, 
  Bookmark,
  Eye,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InstagramEmbed } from "@/components/media/InstagramEmbed";

interface InstagramReel {
  id: string;
  post_id: string;
  url: string;
  caption?: string;
  hashtags?: string[];
  username?: string;
  display_name?: string;
  followers?: number;
  verified?: boolean;
  likes?: number;
  comments?: number;
  video_view_count?: number;
  video_play_count?: number;
  viral_score?: number;
  engagement_rate?: number;
  timestamp?: string;
  thumbnail_url?: string;
  video_url?: string;
  video_duration?: number;
}

interface ReelCardProps {
  reel: InstagramReel;
  onGenerateScript?: (script: any) => void;
}

export const ReelCard = ({ reel, onGenerateScript }: ReelCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTimeAgo = (timestamp?: string) => {
    if (!timestamp) return '';
    
    try {
      const now = new Date();
      const posted = new Date(timestamp);
      const diff = now.getTime() - posted.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 24) return `${hours}h ago`;
      
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      
      const months = Math.floor(days / 30);
      if (months < 12) return `${months}mo ago`;
      
      const years = Math.floor(months / 12);
      return `${years}y ago`;
    } catch (error) {
      console.error('Error parsing timestamp:', timestamp, error);
      return '';
    }
  };

  const getThumbnailUrl = (url: string) => {
    if (!url) return null;
    return `https://siafgzfpzowztfhlajtn.supabase.co/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const openInstagramPost = () => {
    window.open(reel.url, '_blank');
  };

  const handlePlayVideo = () => {
    setIsPlaying(true);
  };

  const handleSaveVideo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to save videos');
        return;
      }

      const { error } = await supabase.from('content_items').insert({
        user_id: user.id,
        platform: 'instagram',
        source_url: reel.url,
        source_post_id: reel.post_id,
        thumbnail_url: reel.thumbnail_url || null,
        caption: reel.caption || null,
        tags: reel.hashtags || [],
        status: 'saved'
      });

      if (error) throw error;
      toast.success('Saved to Content');
    } catch (error) {
      console.error('Save video error:', error);
      toast.error('Failed to save video');
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getViralScoreColor = (score?: number) => {
    if (!score) return "bg-gradient-to-r from-gray-500 to-gray-600";
    if (score >= 80) return "bg-gradient-to-r from-red-500 to-pink-500";
    if (score >= 60) return "bg-gradient-to-r from-orange-500 to-yellow-500";
    if (score >= 40) return "bg-gradient-to-r from-blue-500 to-cyan-500";
    return "bg-gradient-to-r from-gray-500 to-gray-600";
  };

  const calculateViralScore = (reel: InstagramReel) => {
    if (reel.viral_score && reel.viral_score <= 100) {
      return reel.viral_score;
    }
    
    const likes = reel.likes || 0;
    const views = reel.video_view_count || reel.video_play_count || 0;
    const comments = reel.comments || 0;
    
    if (views === 0) return 0;
    
    const engagementRate = ((likes + comments) / views) * 100;
    const likeRatio = (likes / views) * 100;
    
    let score = Math.min(100, (engagementRate * 0.7) + (likeRatio * 0.3));
    
    if (views > 1000000) score = Math.min(100, score + 10);
    if (views > 10000000) score = Math.min(100, score + 15);
    if (likes > 100000) score = Math.min(100, score + 5);
    
    return Math.round(score);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group flex flex-col h-full">
      {/* Instagram Embed / Thumbnail */}
      <div className="relative">
        {isPlaying ? (
          <InstagramEmbed 
            url={reel.url}
            className=""
          />
        ) : (
          <div className="aspect-[9/16] bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-orange-500/20 flex items-center justify-center relative overflow-hidden" onClick={handlePlayVideo}>
            {reel.thumbnail_url && !imageError ? (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <img 
                  src={getThumbnailUrl(reel.thumbnail_url)}
                  alt={`Instagram reel by @${reel.username}`}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading="lazy"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Play className="w-16 h-16 mb-2" />
                <p className="text-sm">Thumbnail not available</p>
              </div>
            )}
            
            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-black ml-1" />
              </div>
            </div>
          </div>
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getViralScoreColor(calculateViralScore(reel))} text-white border-none`}>
            <Sparkles className="w-3 h-3 mr-1" />
            {calculateViralScore(reel)}
          </Badge>
        </div>
        
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-black/60 text-white border-none">
            <Clock className="w-3 h-3 mr-1" />
            {getTimeAgo(reel.timestamp)}
          </Badge>
        </div>
        
        {reel.video_duration && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-black/60 text-white border-none">
              {formatDuration(reel.video_duration)}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center overflow-hidden">
            <span className="text-white text-xs font-bold">
              {(reel.username || 'U')?.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm">@{reel.username || 'unknown'}</p>
              {reel.verified && (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            {reel.followers && (
              <p className="text-xs text-muted-foreground">
                {formatNumber(reel.followers)} followers
              </p>
            )}
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm mb-3 line-clamp-2 leading-relaxed flex-1">
          {reel.caption || 'No caption available'}
        </p>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {(reel.hashtags || []).slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              #{tag.replace('#', '')}
            </Badge>
          ))}
          {(reel.hashtags || []).length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{(reel.hashtags || []).length - 3}
            </Badge>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Heart className="w-4 h-4 text-red-500" />
              {formatNumber(reel.likes || 0)}
            </div>
            <span className="text-xs text-muted-foreground">Likes</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-medium">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              {formatNumber(reel.comments || 0)}
            </div>
            <span className="text-xs text-muted-foreground">Comments</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Eye className="w-4 h-4 text-green-500" />
              {formatNumber(reel.video_view_count || reel.video_play_count || 0)}
            </div>
            <span className="text-xs text-muted-foreground">Views</span>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="flex justify-start items-center mb-3">
          <Badge variant="outline" className="text-xs">
            {reel.engagement_rate ? `${reel.engagement_rate.toFixed(1)}% ER` : 'N/A ER'}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Button 
            size="sm" 
            className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90"
            onClick={handleSaveVideo}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Save Reel
          </Button>
          <Button size="sm" variant="outline" onClick={openInstagramPost}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};