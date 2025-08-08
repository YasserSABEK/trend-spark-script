import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, CalendarClock, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

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

  return (
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
                <Card key={it.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base line-clamp-1">
                      {it.caption || `${it.platform} post`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="aspect-[9/16] bg-muted rounded-md overflow-hidden flex items-center justify-center">
                      {it.thumbnail_url ? (
                        <img
                          src={it.thumbnail_url}
                          alt={`Thumbnail of ${it.platform} post`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookmarkCheck className="w-5 h-5" />
                          <span>No thumbnail</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {it.tags?.slice(0, 3).map((t, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">#{t}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarClock className="w-3 h-3" />
                      <span>Saved {new Date(it.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button size="sm" onClick={() => openSource(it.source_url)}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Post
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
