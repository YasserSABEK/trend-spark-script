import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { 
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import { KanbanColumn } from "@/components/KanbanColumn";
import { ContentPlanCard } from "@/components/ContentPlanCard";
import { NewContentModal } from "@/components/NewContentModal";
import { Input } from "@/components/ui/input";
import { Search, Kanban } from "lucide-react";

interface ContentItem {
  id: string;
  title: string | null;
  user_id: string;
  platform: string;
  source_url: string | null;
  script_id: string | null;
  status: string;
  planned_publish_date: string | null;
  notes: string | null;
  caption: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const STATUSES = ['idea', 'scripting', 'ready', 'posted', 'archived'] as const;

export default function ContentCalendar() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast: showToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    document.title = "Content Planner | Viraltify";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Plan, organize and track your content creation workflow");
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
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        showToast({
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
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load content error:", error);
        showToast({
          title: "Failed to load content",
          description: "Please try again.",
          variant: "destructive",
        });
      } else {
        setItems((data as ContentItem[]) || []);
      }
    } catch (error) {
      console.error("Load content error:", error);
      showToast({
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

  const handleUpdateItem = (itemId: string, updates: Partial<ContentItem>) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleContentCreated = (newContent: ContentItem) => {
    setItems(prev => [newContent, ...prev]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're dragging over a column (status)
    if (STATUSES.includes(overId as any)) {
      const item = items.find(item => item.id === activeId);
      if (!item || item.status === overId) return;

      try {
        const { error } = await supabase
          .from("content_items")
          .update({ status: overId })
          .eq("id", activeId);

        if (error) throw error;

        handleUpdateItem(activeId, { status: overId });
        toast(`Content moved to ${overId}`);
      } catch (error) {
        console.error("Update status error:", error);
        toast("Failed to update content status");
      }
    }
  };

  const getItemsByStatus = (status: string) => {
    return filteredItems.filter(item => item.status === status);
  };

  const activeItem = activeId ? items.find(item => item.id === activeId) : null;

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Content Planner</h1>
          <p className="text-muted-foreground">Loading your content workflow...</p>
        </header>
        <div className="flex gap-4 overflow-x-auto">
          {STATUSES.map((status) => (
            <div key={status} className="min-w-[280px] max-w-[320px] space-y-3">
              <div className="h-10 bg-muted/50 rounded animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-32 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4 h-full">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <Kanban className="w-6 h-6 text-primary" />
                Content Planner
              </h1>
              <p className="text-muted-foreground">
                Plan, organize and track your content creation workflow
              </p>
            </div>
            <NewContentModal onContentCreated={handleContentCreated} />
          </div>

          {/* Search */}
          {items.length > 0 && (
            <div className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
          )}
        </header>

        {/* Kanban Board */}
        {items.length === 0 && !searchTerm ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Kanban className="w-8 h-8 text-primary/60" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Start Planning Your Content</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first content idea and organize your workflow
                </p>
              </div>
              <NewContentModal onContentCreated={handleContentCreated} />
            </div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                id={status}
                title={status}
                items={getItemsByStatus(status)}
                onDelete={handleDeleteItem}
                onUpdate={handleUpdateItem}
                defaultCollapsed={status === 'archived'}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {items.length > 0 && (
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            {searchTerm ? (
              <>Showing {filteredItems.length} of {items.length} content items</>
            ) : (
              <>
                {items.length} content item{items.length !== 1 ? 's' : ''} • 
                {getItemsByStatus('idea').length} ideas • 
                {getItemsByStatus('scripting').length} in progress • 
                {getItemsByStatus('ready').length} ready • 
                {getItemsByStatus('posted').length} posted
              </>
            )}
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem ? (
          <ContentPlanCard
            item={activeItem}
            onDelete={() => {}}
            onUpdate={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}