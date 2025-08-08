import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoPlayer } from "@/components/VideoPlayer";

import { Heart, MessageCircle, Share, Bookmark, Play, ExternalLink, Sparkles, Clock, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";

interface TikTokVideo {
  id: string;
  url: string;
  web_video_url?: string;
  caption?: string;
  hashtags?: string[];
  digg_count: number;
  share_count: number;
  play_count: number;
  comment_count: number;
  collect_count: number;
  viral_score?: number;
  engagement_rate?: number;
  timestamp?: string;
  username?: string;
  display_name?: string;
  author_avatar?: string;
  verified?: boolean;
  followers?: number;
  video_duration?: number;
  music_name?: string;
  music_author?: string;
  music_original?: boolean;
  search_hashtag?: string;
  post_id: string;
  scraped_at?: string;
  platform: string;
}

interface TikTokVideoCardProps {
  video: TikTokVideo;
  onGenerateScript?: (result: any) => void;
}

export function TikTokVideoCard({ video, onGenerateScript }: TikTokVideoCardProps) {
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTimeAgo = (timestamp?: string) => {
    if (!timestamp) return '';
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  const openTikTokPost = () => {
    if (video.web_video_url || video.url) {
      window.open(video.web_video_url || video.url, '_blank');
    }
  };

  const handlePlayVideo = () => {
    // TikTok doesn't provide direct video URLs, so we open the TikTok post
    openTikTokPost();
  };

  const handleSaveVideo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save videos");
        return;
      }

      const { error } = await supabase.from('content_items').insert({
        user_id: user.id,
        platform: video.platform || 'tiktok',
        source_url: video.web_video_url || video.url,
        source_post_id: video.post_id,
        caption: video.caption || null,
        tags: video.hashtags || [],
        status: 'saved',
        thumbnail_url: null
      });

      if (error) {
        console.error('Error saving video:', error);
        toast.error("Failed to save");
        return;
      }

      toast.success("Saved to Content");
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          {/* Video Thumbnail */}
          <div className="relative aspect-[9/16] bg-muted group cursor-pointer" onClick={handlePlayVideo}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-20 group-hover:bg-black/20 transition-colors">
              <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-black" fill="currentColor" />
              </div>
            </div>

            {/* Video duration */}
            {video.video_duration && (
              <div className="absolute top-2 right-2 z-20">
                <Badge variant="secondary" className="bg-black/60 text-white border-none">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(video.video_duration)}
                </Badge>
              </div>
            )}

            {/* Engagement metrics overlay */}
            <div className="absolute bottom-2 left-2 right-2 z-20 space-y-2">
              <div className="flex items-center gap-3 text-white text-sm">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {formatNumber(video.digg_count)}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {formatNumber(video.comment_count)}
                </div>
                <div className="flex items-center gap-1">
                  <Play className="w-4 h-4" />
                  {formatNumber(video.play_count)}
                </div>
                <div className="flex items-center gap-1">
                  <Share className="w-4 h-4" />
                  {formatNumber(video.share_count)}
                </div>
              </div>

              {video.viral_score && (
                <div className="flex items-center gap-1 text-white">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">Viral Score: {video.viral_score}</span>
                </div>
              )}
            </div>
          </div>

          {/* Creator Info */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={video.author_avatar} alt={video.username} />
                <AvatarFallback>{video.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm truncate">@{video.username}</p>
                  {video.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
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
              <div className="text-xs text-muted-foreground">
                {getTimeAgo(video.timestamp)}
              </div>
            </div>

            {/* Caption */}
            {video.caption && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {video.caption}
              </p>
            )}

            {/* Music Info */}
            {video.music_name && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Music className="w-3 h-3" />
                <span className="truncate">
                  {video.music_name} - {video.music_author}
                  {video.music_original && " (Original)"}
                </span>
              </div>
            )}

            {/* Hashtags */}
            {video.hashtags && video.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {video.hashtags.slice(0, 3).map((hashtag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{hashtag}
                  </Badge>
                ))}
                {video.hashtags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{video.hashtags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 space-y-2">
          <div className="flex gap-2 w-full">
            <Button onClick={handleSaveVideo} className="flex-1" size="sm">
              <Bookmark className="w-4 h-4 mr-2" />
              Save Video
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openTikTokPost}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {showVideoPlayer && (
        <VideoPlayer
          isOpen={showVideoPlayer}
          videoUrl=""
          onClose={() => setShowVideoPlayer(false)}
          thumbnailUrl=""
          title={video.caption || "TikTok Video"}
          instagramUrl={video.web_video_url || video.url}
        />
      )}
    </>
  );
}