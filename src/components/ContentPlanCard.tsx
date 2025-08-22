import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  GripVertical,
  Trash2, 
  Edit3,
  Calendar,
  FileText,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ContentItem {
  id: string;
  title: string | null;
  platform: string;
  status: string;
  script_id: string | null;
  source_url: string | null;
  planned_publish_date: string | null;
  notes: string | null;
  caption: string | null;
  created_at: string;
  updated_at: string;
}

interface ContentPlanCardProps {
  item: ContentItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ContentItem>) => void;
}

export function ContentPlanCard({ item, onDelete, onUpdate }: ContentPlanCardProps) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState(item.notes || "");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      
      onDelete(item.id);
      toast.success("Content deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete content");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (editTitle.trim() === item.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("content_items")
        .update({ title: editTitle.trim() })
        .eq("id", item.id);

      if (error) throw error;
      
      onUpdate(item.id, { title: editTitle.trim() });
      setIsEditingTitle(false);
      toast.success("Title updated");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update title");
      setEditTitle(item.title || "");
    }
  };

  const handleUpdateNotes = async () => {
    if (editNotes.trim() === item.notes) {
      setIsEditingNotes(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("content_items")
        .update({ notes: editNotes.trim() || null })
        .eq("id", item.id);

      if (error) throw error;
      
      onUpdate(item.id, { notes: editNotes.trim() || null });
      setIsEditingNotes(false);
      toast.success("Notes updated");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update notes");
      setEditNotes(item.notes || "");
    }
  };

  const handleGenerateScript = () => {
    navigate(`/script-generator?contentId=${item.id}`);
  };

  const handleViewOriginal = () => {
    if (item.source_url) {
      window.open(item.source_url, '_blank');
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return 'bg-pink-500/10 text-pink-700 border-pink-200';
      case 'instagram':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md border-border/50 hover:border-border ${
        isDragging ? 'opacity-50 rotate-2 scale-105 z-50' : ''
      }`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground hover:text-foreground" />
      </div>

      {/* Delete Button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="w-6 h-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Content</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this content item? This action cannot be undone.
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

      <CardHeader className="pb-2 pt-8">
        {/* Platform Badge */}
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant="outline" 
            className={`text-xs capitalize ${getPlatformColor(item.platform)}`}
          >
            {item.platform}
          </Badge>
          {item.planned_publish_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(item.planned_publish_date)}
            </div>
          )}
        </div>

        {/* Title */}
        {isEditingTitle ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdateTitle();
              if (e.key === 'Escape') {
                setEditTitle(item.title || "");
                setIsEditingTitle(false);
              }
            }}
            placeholder="Content title..."
            className="text-sm font-medium h-8 border-0 p-0 focus-visible:ring-1"
            autoFocus
          />
        ) : (
          <h3 
            className="text-sm font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => setIsEditingTitle(true)}
          >
            {item.title || "Untitled Content"}
          </h3>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Script Status */}
        <div className="flex items-center justify-between">
          {item.script_id ? (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <FileText className="w-3 h-3" />
              Script ready
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateScript}
              className="h-7 text-xs border-dashed hover:bg-primary/5 hover:border-primary/40"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Generate Script
            </Button>
          )}
          
          {item.source_url && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleViewOriginal}
              className="h-6 w-6 p-0"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1">
          {isEditingNotes ? (
            <Textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              onBlur={handleUpdateNotes}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditNotes(item.notes || "");
                  setIsEditingNotes(false);
                }
              }}
              placeholder="Add notes..."
              className="text-xs h-16 resize-none border-0 p-0 focus-visible:ring-1"
              autoFocus
            />
          ) : (
            <div 
              className="text-xs text-muted-foreground line-clamp-3 cursor-pointer hover:text-foreground transition-colors min-h-[3rem] border border-transparent hover:border-border/50 rounded p-1"
              onClick={() => setIsEditingNotes(true)}
            >
              {item.notes || "Add notes..."}
            </div>
          )}
        </div>

        {/* Caption Preview */}
        {item.caption && (
          <div className="text-xs text-muted-foreground/70 line-clamp-2 border-t border-border/30 pt-2">
            {item.caption}
          </div>
        )}
      </CardContent>
    </Card>
  );
}