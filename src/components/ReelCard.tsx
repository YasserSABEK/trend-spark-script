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
  ExternalLink
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InstagramEmbed } from "@/components/media/InstagramEmbed";

interface InstagramReel {
  id: string;
  post_id: string;
  url: string;
  caption: string;
  hashtags: string[];
  username: string;
  display_name: string;
  followers: number | null;
  verified: boolean;
  likes: number | null;
  comments: number | null;
  video_view_count: number | null;
  viral_score: number | null;
  engagement_rate: number | null;
  timestamp: string;
  scraped_at: string;
  thumbnail_url: string;
  video_url?: string;
}

interface ReelCardProps {
  reel: InstagramReel;
  onGenerateScript?: (script: any) => void;
}

export const ReelCard = ({ reel, onGenerateScript }: ReelCardProps) => {
const [isPlaying, setIsPlaying] = useState(false);
const [imageError, setImageError] = useState(false);
const [imageLoading, setImageLoading] = useState(true);
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return '';
    
    try {
      const now = new Date();
      const posted = new Date(timestamp);
      const diff = now.getTime() - posted.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 24) return `${hours}h ago`;
      
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch (error) {
      console.error('Error parsing timestamp:', timestamp, error);
      return '';
    }
  };

  const getThumbnailUrl = (url: string) => {
    if (!url) return null;
    // Try the direct URL first, fallback to proxy if needed
    return url;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error('Thumbnail failed to load:', reel.thumbnail_url);
    setImageLoading(false);
    setImageError(true);
    
    // Try with proxy as fallback
    const img = document.createElement('img');
    img.onload = () => {
      setImageError(false);
      const currentImg = document.querySelector(`img[alt="Instagram reel by @${reel.username}"]`) as HTMLImageElement;
      if (currentImg) {
        currentImg.src = `https://siafgzfpzowztfhlajtn.supabase.co/functions/v1/image-proxy?url=${encodeURIComponent(reel.thumbnail_url)}`;
      }
    };
    img.src = `https://siafgzfpzowztfhlajtn.supabase.co/functions/v1/image-proxy?url=${encodeURIComponent(reel.thumbnail_url)}`;
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
      {/* Video Container */}
      <div className="aspect-[9/16] bg-gradient-to-br from-instagram-pink/20 via-instagram-purple/20 to-instagram-orange/20 flex items-center justify-center relative overflow-hidden">
        {/* Thumbnail Image */}
        {!isPlaying && (
          <div className="absolute inset-0 w-full h-full" onClick={handlePlayVideo}>
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
                  className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-300 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading="lazy"
                />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
                <Play className="w-16 h-16 text-primary/60" />
              </div>
            )}
            
            {/* Thumbnail Overlays */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            {reel.viral_score !== undefined && reel.viral_score > 0 && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                  {reel.viral_score}
                </Badge>
              </div>
            )}
            {reel.timestamp && getTimeAgo(reel.timestamp) && (
              <div className="absolute bottom-3 left-3">
                <Badge variant="secondary" className="bg-black/60 text-white border-none">
                  <Clock className="w-3 h-3 mr-1" />
                  {getTimeAgo(reel.timestamp)}
                </Badge>
              </div>
            )}
            <div className="absolute center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Inline Video Player */}
        {isPlaying && (
          <div className="absolute inset-0">
            <InstagramEmbed url={reel.url} className="w-full h-full" />
          </div>
        )}
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
            onClick={handleSaveVideo}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Save Video
          </Button>
          <Button size="sm" variant="outline" onClick={openInstagramPost}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

    </Card>
  );
};