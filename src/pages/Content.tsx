import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, CalendarClock, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { DraggableContentItem } from "@/components/dnd/DraggableContentItem";
import { ContentDragOverlay } from "@/components/dnd/DragOverlay";

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
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);

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

  const grouped = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    for (const it of items) {
      const key = it.status || "saved";
      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    }
    return groups;
  }, [items]);

  const openSource = (url: string) => window.open(url, "_blank");

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'content-item') {
      setActiveItem(active.data.current.item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    
    const { active, over } = event;
    if (!over || !active.data.current?.item) return;

    const draggedItem = active.data.current.item as ContentItem;
    
    // Handle drop actions based on the drop zone
    if (over.id === 'script-generator-drop' || over.id === 'my-scripts-drop') {
      toast.success(`Content ready for ${over.id.includes('script-generator') ? 'script generation' : 'analysis'}!`, {
        description: `"${draggedItem.caption || 'Video'}" has been prepared for processing.`
      });
    }
  };

  return (
    <DndContext 
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Content Library</h1>
        <p className="text-muted-foreground">All videos you saved from Instagram and TikTok.</p>
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
              <CardFooter>
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No content yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Use the Save Video button on any Reel or TikTok to add items here.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([status, list]) => (
          <section key={status} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">{status}</Badge>
              <span className="text-xs text-muted-foreground">{list.length} items</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((it) => (
                <DraggableContentItem 
                  key={it.id} 
                  item={it} 
                  onOpenSource={openSource}
                />
              ))}
            </div>
          </section>
        ))
      )}
      
      <ContentDragOverlay activeItem={activeItem} />
    </div>
    </DndContext>
  );
}
