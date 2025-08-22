import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface NewContentModalProps {
  onContentCreated: (content: any) => void;
}

export function NewContentModal({ onContentCreated }: NewContentModalProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    platform: "",
    notes: "",
    planned_publish_date: null as Date | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.platform) {
      toast.error("Please fill in title and platform");
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to create content");
        return;
      }

      const { data, error } = await supabase
        .from("content_items")
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          platform: formData.platform,
          status: "idea",
          notes: formData.notes.trim() || null,
          planned_publish_date: formData.planned_publish_date?.toISOString() || null,
          source_url: "", // Required field, empty for new content
          tags: [],
        })
        .select()
        .single();

      if (error) throw error;

      onContentCreated(data);
      setOpen(false);
      setFormData({
        title: "",
        platform: "",
        notes: "",
        planned_publish_date: null,
      });
      toast.success("Content created successfully!");
    } catch (error) {
      console.error("Create content error:", error);
      toast.error("Failed to create content");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      platform: "",
      notes: "",
      planned_publish_date: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create New Content
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Content Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., How to get 1M followers..."
              className="focus-visible:ring-primary"
              required
            />
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Select 
              value={formData.platform} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
              required
            >
              <SelectTrigger className="focus:ring-primary">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Planned Date */}
          <div className="space-y-2">
            <Label>Planned Publish Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.planned_publish_date ? (
                    format(formData.planned_publish_date, "PPP")
                  ) : (
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.planned_publish_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, planned_publish_date: date || null }))}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add your ideas, hooks, or notes..."
              className="resize-none h-20 focus-visible:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !formData.title.trim() || !formData.platform}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isCreating ? "Creating..." : "Create Content"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}