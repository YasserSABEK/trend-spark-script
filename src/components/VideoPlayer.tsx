import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  instagramUrl: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  isOpen,
  onClose,
  videoUrl,
  thumbnailUrl,
  title,
  instagramUrl
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {videoUrl ? (
            <video 
              controls 
              autoPlay 
              muted
              className="w-full rounded-lg aspect-[9/16] object-cover"
              poster={thumbnailUrl}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full aspect-[9/16] bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Video not available</p>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.open(instagramUrl, '_blank')}
            className="w-full text-xs text-muted-foreground"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Open in Instagram
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};