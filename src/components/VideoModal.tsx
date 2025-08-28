import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useState } from "react";

interface VideoModalProps {
  videoUrl: string;
  buttonText: string;
  buttonVariant?: "default" | "outline";
}

export const VideoModal = ({ videoUrl, buttonText, buttonVariant = "outline" }: VideoModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Convert YouTube URL to embed URL
  const getEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          className={buttonVariant === "outline" 
            ? "border-purple-800 text-purple-800 hover:bg-purple-50 px-6 py-2 rounded-lg" 
            : "bg-gradient-to-r from-purple-800 to-pink-500 text-white px-6 py-2 hover:opacity-90 shadow-md rounded-lg"
          }
        >
          <Play className="w-4 h-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full p-0 bg-black">
        <DialogTitle className="sr-only">Video Demo</DialogTitle>
        <div className="relative w-full h-0 pb-[56.25%]">
          {isOpen && (
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={getEmbedUrl(videoUrl)}
              title="Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};