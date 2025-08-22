
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageSquare, 
  Clock, 
  Bookmark,
  Eye,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedInstagramEmbed } from "@/components/media/EnhancedInstagramEmbed";
import { CreatorProfileAvatar } from "@/components/profile/CreatorProfileAvatar";

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
  profile_photo_url?: string;
}

interface ReelCardProps {
  reel: InstagramReel;
  onGenerateScript?: (script: any) => void;
}

export const ReelCard = ({ reel, onGenerateScript }: ReelCardProps) => {
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

  const openInstagramPost = () => {
    window.open(reel.url, '_blank');
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
        thumbnail_url: null,
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
        {/* Enhanced Instagram Embed */}
        <div className="absolute inset-0">
          <EnhancedInstagramEmbed 
            url={reel.url} 
            className="w-full h-full"
            thumbnailUrl={reel.thumbnail_url}
            caption={reel.caption}
            username={reel.username}
            displayName={reel.display_name}
            likes={reel.likes}
            comments={reel.comments}
            videoViewCount={reel.video_view_count}
            timestamp={reel.timestamp}
            verified={reel.verified}
          />
        </div>
        
        {/* Overlays */}
        {reel.viral_score !== undefined && reel.viral_score > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
              {reel.viral_score}
            </Badge>
          </div>
        )}
        {reel.timestamp && getTimeAgo(reel.timestamp) && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge variant="secondary" className="bg-black/60 text-white border-none">
              <Clock className="w-3 h-3 mr-1" />
              {getTimeAgo(reel.timestamp)}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-3">
          <CreatorProfileAvatar 
            profilePhotoUrl={reel.profile_photo_url}
            creatorName={reel.display_name || reel.username}
            size="sm"
          />
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
          {(reel.hashtags || []).slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {(reel.hashtags || []).length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{(reel.hashtags || []).length - 3}
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
