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
  Share,
  Music,
  Sparkles
} from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TikTokVideo {
  id: string;
  post_id: string;
  url: string;
  web_video_url?: string;
  caption?: string;
  hashtags?: string[];
  username?: string;
  display_name?: string;
  author_avatar?: string;
  followers?: number;
  verified?: boolean;
  digg_count: number;
  comment_count: number;
  share_count: number;
  play_count: number;
  collect_count: number;
  viral_score?: number;
  engagement_rate?: number;
  timestamp?: string;
  scraped_at?: string;
  thumbnail_url?: string;
  video_duration?: number;
  music_name?: string;
  music_author?: string;
  music_original?: boolean;
  platform?: string;
}

interface TikTokVideoCardProps {
  video: TikTokVideo;
  onGenerateScript?: (script: any) => void;
}

export const TikTokVideoCard = ({ video, onGenerateScript }: TikTokVideoCardProps) => {
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTimeAgo = (timestamp?: string) => {
    if (!timestamp) return '';
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
  };

  const openTikTokPost = () => {
    window.open(video.web_video_url || video.url, '_blank');
  };

  const handlePlayVideo = () => {
    // TikTok doesn't provide direct video URLs, so we open the TikTok post
    openTikTokPost();
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
        platform: 'tiktok',
        source_url: video.web_video_url || video.url,
        source_post_id: video.post_id,
        thumbnail_url: video.thumbnail_url || null,
        caption: video.caption || null,
        tags: video.hashtags || [],
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

  const calculateViralScore = (video: TikTokVideo) => {
    if (video.viral_score && video.viral_score <= 100) {
      return video.viral_score;
    }
    
    // Calculate viral score based on engagement metrics (out of 100)
    const likes = video.digg_count || 0;
    const views = video.play_count || 0;
    const comments = video.comment_count || 0;
    const shares = video.share_count || 0;
    
    if (views === 0) return 0;
    
    const engagementRate = ((likes + comments + shares) / views) * 100;
    const likeRatio = (likes / views) * 100;
    
    // Weighted score calculation (out of 100)
    let score = Math.min(100, (engagementRate * 0.7) + (likeRatio * 0.3));
    
    // Boost score based on absolute numbers
    if (views > 1000000) score = Math.min(100, score + 10);
    if (views > 10000000) score = Math.min(100, score + 15);
    if (likes > 100000) score = Math.min(100, score + 5);
    
    return Math.round(score);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
      {/* Video Thumbnail */}
      <div 
        className="aspect-[9/16] bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-red-400/20 flex items-center justify-center relative overflow-hidden"
        onClick={handlePlayVideo}
      >
        {video.thumbnail_url ? (
          <>
            <img 
              src={video.thumbnail_url}
              alt="TikTok video thumbnail"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
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
              className="thumbnail-fallback absolute inset-0 w-full h-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 flex items-center justify-center"
              style={{ display: 'none' }}
            >
              <Play className="w-16 h-16 text-white opacity-80" />
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 flex items-center justify-center">
            <Play className="w-16 h-16 text-white opacity-80" />
          </div>
        )}
        
        {/* Overlay Elements */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        
        {/* Viral Score Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getViralScoreColor(video.viral_score)} text-white border-none`}>
            <Sparkles className="w-3 h-3 mr-1" />
            {video.viral_score || 0}
          </Badge>
        </div>
        
        {/* Time Since Posted */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-black/60 text-white border-none">
            <Clock className="w-3 h-3 mr-1" />
            {getTimeAgo(video.timestamp)}
          </Badge>
        </div>
        
        {/* Duration Badge */}
        {video.video_duration && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-black/60 text-white border-none">
              {formatDuration(video.video_duration)}
            </Badge>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col h-full">
        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
            {video.author_avatar ? (
              <img 
                src={video.author_avatar} 
                alt={video.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-bold">
                {video.username?.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm">@{video.username}</p>
              {video.verified && (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            {video.followers && (
              <p className="text-xs text-muted-foreground">
                {formatNumber(video.followers)} followers
              </p>
            )}
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm mb-3 line-clamp-2 leading-relaxed">{video.caption}</p>

        {/* Music Info */}
        {video.music_name && (
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            <Music className="w-3 h-3" />
            <span className="truncate">
              {video.music_name} - {video.music_author}
              {video.music_original && " (Original)"}
            </span>
          </div>
        )}

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {(video.hashtags || []).slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
          {(video.hashtags || []).length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{(video.hashtags || []).length - 3}
            </Badge>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Heart className="w-4 h-4 text-red-500" />
              {formatNumber(video.digg_count)}
            </div>
            <span className="text-xs text-muted-foreground">Likes</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-medium">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              {formatNumber(video.comment_count)}
            </div>
            <span className="text-xs text-muted-foreground">Comments</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Eye className="w-4 h-4 text-green-500" />
              {formatNumber(video.play_count)}
            </div>
            <span className="text-xs text-muted-foreground">Views</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Share className="w-4 h-4 text-purple-500" />
              {formatNumber(video.share_count)}
            </div>
            <span className="text-xs text-muted-foreground">Shares</span>
          </div>
        </div>

        {/* Engagement Rate and Viral Score */}
        <div className="flex justify-between items-center mb-4">
          <Badge variant="outline" className="text-xs">
            {video.engagement_rate ? `${video.engagement_rate.toFixed(1)}% ER` : 'N/A ER'}
          </Badge>
          <Badge className={`${getViralScoreColor(calculateViralScore(video))} text-white text-xs`}>
            Viral Score: {calculateViralScore(video)}
          </Badge>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="mt-auto flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
            onClick={handleSaveVideo}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Save Video
          </Button>
          <Button size="sm" variant="outline" onClick={openTikTokPost}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      <VideoPlayer
        isOpen={showVideoPlayer}
        onClose={() => setShowVideoPlayer(false)}
        videoUrl=""
        thumbnailUrl={video.thumbnail_url || ''}
        title={video.caption || 'TikTok Video'}
        instagramUrl={video.web_video_url || video.url}
      />
    </Card>
  );
};