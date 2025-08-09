import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Trash2, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { InstagramEmbed } from "@/components/media/InstagramEmbed";
import { TikTokEmbed } from "@/components/media/TikTokEmbed";

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

export function Content() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Content Library | Viraltify";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Content Library to manage saved videos and posts");
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        toast.error("Please sign in to view your content");
        return;
      }
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "saved")
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
        toast.error("Failed to load content");
      } else {
        setItems((data as ContentItem[]) || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const generateScript = (item: ContentItem) => {
    const params = new URLSearchParams({
      prompt: `Create a script inspired by this ${item.platform} post: "${item.caption || 'viral video'}"`,
      caption: item.caption || '',
      platform: item.platform
    });
    navigate(`/script-generator?${params.toString()}`);
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", itemId);
      
      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success("Content deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete content");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My Content</h1>
        <p className="text-muted-foreground">Saved videos from Instagram and TikTok.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No saved content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Use the Save Video button on any Reel or TikTok to add items here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative">
                {item.platform === 'instagram' ? (
                  <InstagramEmbed 
                    url={item.source_url}
                    className="aspect-[9/16]"
                  />
                ) : (
                  <TikTokEmbed 
                    url={item.source_url}
                    thumbnailUrl={item.thumbnail_url || undefined}
                    className="aspect-[9/16]"
                  />
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <p className="text-sm line-clamp-2 leading-relaxed">
                    {item.caption || `${item.platform} post`}
                  </p>
                  
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{item.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => generateScript(item)}
                      className="flex-1"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Script
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyUrl(item.source_url)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
