import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { GripVertical, Bookmark, CalendarDays, CheckCircle2, Rocket, Archive, ImageOff } from "lucide-react";

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

type ColumnKey = "saved" | "scripting" | "ready" | "posted" | "archived";

const COLUMN_META: Record<ColumnKey, { title: string; Icon: any; }> = {
  saved: { title: "Saved Videos", Icon: Bookmark },
  scripting: { title: "Scripting", Icon: Rocket },
  ready: { title: "Ready to Post", Icon: CalendarDays },
  posted: { title: "Posted", Icon: CheckCircle2 },
  archived: { title: "Archive", Icon: Archive },
};

function SortableCard({ item }: { item: ContentItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, data: { type: "item", item } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm line-clamp-2 pr-6">{item.caption || `${item.platform} post`}</CardTitle>
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="aspect-[9/16] bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt={`Thumbnail of ${item.platform} post`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <ImageOff className="w-4 h-4" />
              <span>No thumbnail</span>
            </div>
          )}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((t, i) => (
              <Badge key={i} variant="secondary" className="text-xs">#{t}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Column({ id, title, Icon, items }: { id: ColumnKey; title: string; Icon: any; items: ContentItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${id}` });
  return (
    <div className="w-[300px] flex-shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge variant="outline" className="ml-auto">{items.length}</Badge>
      </div>
      <div ref={setNodeRef} id={`column-${id}`} className={`rounded-lg border bg-card p-3 min-h-[300px] transition-colors ${isOver ? 'border-primary bg-primary/5' : ''}`}>
        <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">Drop here</div>
            ) : (
              items.map((item) => <SortableCard key={item.id} item={item} />)
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function ContentCalendar() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    document.title = "Content Calendar | Viraltify";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Plan and manage content status with a drag-and-drop calendar board");
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        toast({ title: "Please sign in", description: "You need to be logged in to view your calendar.", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
        toast({ title: "Failed to load items", description: "Please try again.", variant: "destructive" });
      } else {
        setItems((data as ContentItem[]) || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const columns = useMemo(() => {
    const col: Record<ColumnKey, ContentItem[]> = {
      saved: [],
      scripting: [],
      ready: [],
      posted: [],
      archived: [],
    };
    for (const it of items) {
      const key = (it.status as ColumnKey) || "saved";
      if (col[key]) col[key].push(it);
      else col.saved.push(it);
    }
    return col;
  }, [items]);

  const idToItem = useMemo(() => {
    const map = new Map<string, ContentItem>();
    items.forEach((it) => map.set(it.id, it));
    return map;
  }, [items]);

  const findColumnOfItem = (itemId: string): ColumnKey | null => {
    for (const key of Object.keys(columns) as ColumnKey[]) {
      if (columns[key].some((i) => i.id === itemId)) return key;
    }
    return null;
  };

  const onDragStart = (e: DragStartEvent) => {
    const current = e.active.data.current as any;
    if (current?.item) setActiveItem(current.item as ContentItem);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = findColumnOfItem(activeId);
    let toCol: ColumnKey | null = null;

    if (overId.startsWith("column-")) {
      toCol = overId.replace("column-", "") as ColumnKey;
    } else {
      // Dropped over another item: find that item's column
      toCol = findColumnOfItem(overId);
    }

    if (!fromCol || !toCol) return;

    // If same column, reorder only in UI
    if (fromCol === toCol) {
      // Reorder within the same column (UI only)
      const fromIds = columns[fromCol].map((i) => i.id);
      const oldIndex = fromIds.indexOf(activeId);
      const newIndex = fromIds.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(columns[fromCol], oldIndex, newIndex);

      setItems((prev) => {
        const others = prev.filter((p) => p.status !== fromCol);
        // Keep the reordered column items appended to maintain their internal order
        return [...others, ...reordered];
      });
      return;
    }

    // Move to a new column: update DB status and local state
    const dragged = idToItem.get(activeId);
    if (!dragged) return;

    try {
      const { error } = await supabase
        .from("content_items")
        .update({ status: toCol })
        .eq("id", dragged.id);
      if (error) throw error;

      // Update local state
      setItems((prev) => prev.map((it) => (it.id === dragged.id ? { ...it, status: toCol! } : it)));
      const toTitle = COLUMN_META[toCol].title;
      toast({ title: "Status updated", description: `Moved to ${toTitle}.` });
    } catch (err) {
      console.error(err);
      toast({ title: "Update failed", description: "Could not move item.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Content Calendar</h1>
        <p className="text-muted-foreground">Drag videos across stages to track progress.</p>
      </header>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[300px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="rounded-lg border p-3 space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Card key={j}>
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-40 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(Object.keys(COLUMN_META) as ColumnKey[]).map((key) => (
              <Column key={key} id={key} title={COLUMN_META[key].title} Icon={COLUMN_META[key].Icon} items={columns[key]} />
            ))}
          </div>

          <DragOverlay>
            {activeItem ? (
              <Card className="w-[280px] shadow-2xl ring-2 ring-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm line-clamp-2">{activeItem.caption || `${activeItem.platform} post`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[9/16] bg-muted rounded-md overflow-hidden flex items-center justify-center">
                    {activeItem.thumbnail_url ? (
                      <img src={activeItem.thumbnail_url} alt={`Thumbnail of ${activeItem.platform} post`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <ImageOff className="w-4 h-4" />
                        <span>No thumbnail</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
