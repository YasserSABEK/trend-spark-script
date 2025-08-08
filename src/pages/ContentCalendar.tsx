import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { 
  Trash2, 
  ExternalLink, 
  Edit3, 
  ImageOff, 
  Search,
  Bookmark,
  Play
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface ContentItem {
  id: string;
  user_id: string;
  platform: string;
  source_url: string;
  source_post_id: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  status: string;
  scheduled_at: string | null;
  notes: string | null;
  color: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

function ContentCard({ item, onDelete }: { item: ContentItem; onDelete: (id: string) => void }) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      
      onDelete(item.id);
      toast.success("Video deleted from your content");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete video");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewOriginal = () => {
    window.open(item.source_url, '_blank');
  };

  const handleGenerateScript = () => {
    navigate(`/script-generator?contentId=${item.id}`);
  };


  const getThumbnailUrl = (url: string) => {
    if (!url) return null;
    return `https://siafgzfpzowztfhlajtn.supabase.co/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diff = now.getTime() - created.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  return (
    <Card className="group relative overflow-hidden bg-card hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-border">
      {/* Thumbnail Container */}
      <div className="relative aspect-[9/16] overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {item.thumbnail_url ? (
          <>
            <img 
              src={getThumbnailUrl(item.thumbnail_url)}
              alt={`${item.platform} content thumbnail`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                <Play className="w-6 h-6 text-primary-foreground ml-0.5" fill="currentColor" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60">
            <ImageOff className="w-10 h-10 mb-2" />
            <span className="text-xs font-medium">No Preview</span>
          </div>
        )}
        
        {/* Platform Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant="secondary" 
            className="bg-background/90 backdrop-blur-sm border-0 capitalize text-xs font-medium px-2 py-1 shadow-sm"
          >
            {item.platform}
          </Badge>
        </div>

        {/* Time Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge 
            variant="outline" 
            className="bg-black/70 backdrop-blur-sm text-white border-white/20 text-xs px-2 py-1"
          >
            {formatTimeAgo(item.created_at)}
          </Badge>
        </div>

        {/* Delete Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="w-8 h-8 p-0 rounded-full bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/40 backdrop-blur-sm"
                disabled={isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Content</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this content from your saved collection? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Caption */}
          <div>
            <p className="text-sm leading-relaxed line-clamp-2 text-foreground/90">
              {item.caption || `Saved ${item.platform} content`}
            </p>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.slice(0, 3).map((tag, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-xs px-2 py-0.5 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                >
                  #{tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-0.5 bg-muted/50 border-muted-foreground/20 text-muted-foreground"
                >
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Action Bar */}
      <div className="border-t border-border/50 bg-muted/20 p-3">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="w-12 h-10 p-0 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            onClick={handleViewOriginal}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

          <Button 
            size="sm" 
            className="flex-1 h-10 text-xs font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm"
            onClick={handleGenerateScript}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Generate Script
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function ContentCalendar() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    document.title = "My Content | Viraltify";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Manage your saved videos and content in one place");
  }, []);

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    // Filter items based on search term
    if (!searchTerm.trim()) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => 
        item.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.platform.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [items, searchTerm]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be logged in to view your content.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "saved") // Only show saved content for MVP
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load content error:", error);
        toast({
          title: "Failed to load content",
          description: "Please try again.",
          variant: "destructive",
        });
      } else {
        setItems((data as ContentItem[]) || []);
      }
    } catch (error) {
      console.error("Load content error:", error);
      toast({
        title: "Failed to load content",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">My Content</h1>
          <p className="text-muted-foreground">Your saved videos and content</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[9/16]">
                <Skeleton className="w-full h-full" />
              </div>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-9" />
                    <Skeleton className="h-9" />
                    <Skeleton className="h-9" />
                  </div>
                  <Skeleton className="h-8 w-20 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-20">
      <header className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-primary" />
            My Content
          </h1>
          <p className="text-muted-foreground">
            Manage your saved videos and content in one place
          </p>
        </div>

        {/* Search */}
        {items.length > 0 && (
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
      </header>

      {/* Content Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Bookmark className="w-8 h-8 text-primary/60" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {searchTerm ? "No content found" : "No saved content yet"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Start saving videos from Viral Reels to see them here"
                }
              </p>
            </div>
            {!searchTerm && (
              <Button 
                onClick={() => window.location.href = '/viral-reels'}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                Discover Videos
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <ContentCard 
              key={item.id} 
              item={item} 
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {items.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {searchTerm ? (
            <>Showing {filteredItems.length} of {items.length} videos</>
          ) : (
            <>You have {items.length} saved video{items.length !== 1 ? 's' : ''}</>
          )}
        </div>
      )}
    </div>
  );
}