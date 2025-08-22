import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon,
  FileText, 
  Sparkles, 
  ExternalLink,
  Copy,
  Archive,
  Trash2,
  X
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

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
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface GeneratedScript {
  id: string;
  title?: string;
  hook?: string;
  main_content?: string;
  call_to_action?: string;
  script_content?: string;
  script_text?: string;
  script_title?: string;
  created_at: string;
}

interface ContentPlanModalProps {
  item: ContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<ContentItem>) => void;
  onDelete: (id: string) => void;
}

export function ContentPlanModal({ item, open, onOpenChange, onUpdate, onDelete }: ContentPlanModalProps) {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);
  const [scriptUpdating, setScriptUpdating] = useState<{[key: string]: boolean}>({});
  
  const [formData, setFormData] = useState({
    title: "",
    platform: "",
    status: "",
    notes: "",
    planned_publish_date: null as Date | null,
  });

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || "",
        platform: item.platform,
        status: item.status,
        notes: item.notes || "",
        planned_publish_date: item.planned_publish_date ? new Date(item.planned_publish_date) : null,
      });

      // Load script if it exists, or initialize empty script
      if (item.script_id) {
        loadScript(item.script_id);
      } else {
        // Initialize empty script state for immediate editing
        setScript({
          id: '',
          hook: '',
          main_content: '',
          call_to_action: '',
          created_at: ''
        });
      }
    }
  }, [item]);

  const loadScript = async (scriptId: string) => {
    setLoadingScript(true);
    try {
      const { data, error } = await supabase
        .from("generated_scripts")
        .select("*")
        .eq("id", scriptId)
        .single();

      if (error) throw error;
      setScript(data);
    } catch (error) {
      console.error("Load script error:", error);
    } finally {
      setLoadingScript(false);
    }
  };

  const handleUpdate = async (field: string, value: any) => {
    if (!item) return;
    
    setIsUpdating(true);
    try {
      const updateData = { [field]: value };
      
      const { error } = await supabase
        .from("content_items")
        .update(updateData)
        .eq("id", item.id);

      if (error) throw error;
      
      onUpdate(item.id, updateData);
      toast.success("Content updated");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update content");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputBlur = (field: string) => {
    if (!item || formData[field as keyof typeof formData] === item[field as keyof ContentItem]) return;
    handleUpdate(field, formData[field as keyof typeof formData]);
  };

  const createScriptFromField = async (field: string, value: string) => {
    if (!item) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newScript, error } = await supabase
        .from("generated_scripts")
        .insert({
          user_id: user.id,
          title: item.title || 'Untitled Script',
          [field]: value,
          hook: field === 'hook' ? value : '',
          main_content: field === 'main_content' ? value : '',
          call_to_action: field === 'call_to_action' ? value : '',
        })
        .select()
        .single();

      if (error) throw error;

      // Link the new script to the content item
      const { error: linkError } = await supabase
        .from("content_items")
        .update({ script_id: newScript.id })
        .eq("id", item.id);

      if (linkError) throw linkError;

      setScript(newScript);
      onUpdate(item.id, { script_id: newScript.id });
      toast.success("Script created");
    } catch (error) {
      console.error("Script creation error:", error);
      toast.error("Failed to create script");
    }
  };

  const handleScriptUpdate = async (field: string, value: string) => {
    if (!script) return;
    
    // If this is an empty script (no ID), create a new one
    if (!script.id) {
      await createScriptFromField(field, value);
      return;
    }
    
    setScriptUpdating(prev => ({ ...prev, [field]: true }));
    try {
      const { error } = await supabase
        .from("generated_scripts")
        .update({ [field]: value })
        .eq("id", script.id);

      if (error) throw error;
      
      setScript(prev => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      console.error("Script update error:", error);
      toast.error("Failed to update script");
    } finally {
      setScriptUpdating(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleScriptFieldChange = (field: string, value: string) => {
    setScript(prev => prev ? { ...prev, [field]: value } : null);
  };

  const copyFullScript = () => {
    if (!script) return;
    
    const fullScript = [
      script.hook || '',
      script.main_content || '',
      script.call_to_action || ''
    ].filter(Boolean).join('\n\n');
    
    navigator.clipboard.writeText(fullScript);
    toast.success("Script copied to clipboard");
  };

  const parseExistingScript = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length >= 3) {
      return {
        hook: lines[0],
        main_content: lines.slice(1, -1).join('\n'),
        call_to_action: lines[lines.length - 1]
      };
    } else if (lines.length === 2) {
      return {
        hook: lines[0],
        main_content: '',
        call_to_action: lines[1]
      };
    } else if (lines.length === 1) {
      return {
        hook: lines[0],
        main_content: '',
        call_to_action: ''
      };
    }
    
    return { hook: '', main_content: content, call_to_action: '' };
  };

  const handleGenerateScript = () => {
    if (item) {
      navigate(`/script-generator?contentId=${item.id}`);
      onOpenChange(false);
    }
  };

  const handleDuplicate = async () => {
    if (!item) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("content_items")
        .insert({
          user_id: user.id,
          title: `${item.title} (Copy)`,
          platform: item.platform,
          status: "idea",
          notes: item.notes,
          planned_publish_date: null,
          source_url: item.source_url,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Content duplicated");
      onOpenChange(false);
    } catch (error) {
      console.error("Duplicate error:", error);
      toast.error("Failed to duplicate content");
    }
  };

  const handleArchive = () => {
    if (item) {
      handleUpdate("status", "archived");
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    try {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      
      onDelete(item.id);
      onOpenChange(false);
      toast.success("Content deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete content");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idea': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scripting': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ready': return 'bg-green-50 text-green-700 border-green-200';
      case 'posted': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'archived': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok': return 'bg-pink-500/10 text-pink-700 border-pink-200';
      case 'instagram': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pr-6">
          <DialogTitle className="text-xl">Content Plan</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-6 h-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className={`capitalize ${getPlatformColor(formData.platform)}`}>
              {formData.platform}
            </Badge>
            <Badge variant="outline" className={`capitalize ${getStatusColor(formData.status)}`}>
              {formData.status}
            </Badge>
            {formData.planned_publish_date && (
              <Badge variant="outline" className="text-muted-foreground">
                <CalendarIcon className="w-3 h-3 mr-1" />
                {format(formData.planned_publish_date, "MMM dd, yyyy")}
              </Badge>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              onBlur={() => handleInputBlur("title")}
              placeholder="Content title..."
              className="text-lg font-medium h-12"
              disabled={isUpdating}
            />
          </div>

          {/* Platform & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select 
                value={formData.platform} 
                onValueChange={(value) => {
                  handleInputChange("platform", value);
                  handleUpdate("platform", value);
                }}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => {
                  handleInputChange("status", value);
                  handleUpdate("status", value);
                }}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="scripting">Scripting</SelectItem>
                  <SelectItem value="ready">Ready to Post</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Planned Date */}
          <div className="space-y-2">
            <Label>Planned Publish Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isUpdating}
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
                  onSelect={(date) => {
                    handleInputChange("planned_publish_date", date);
                    handleUpdate("planned_publish_date", date?.toISOString() || null);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Script Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Content Script</Label>
              <Button
                onClick={handleGenerateScript}
                variant="outline"
                size="sm"
                className="hover:bg-primary/5 hover:border-primary/40"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {script?.id ? 'Regenerate' : 'Generate'} Script
              </Button>
            </div>

            {loadingScript ? (
              <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Loading script...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {script?.id && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FileText className="w-4 h-4" />
                    Script ready
                  </div>
                )}
                
                {/* Hook Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Hook
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {script?.hook?.length || 0} chars
                    </span>
                  </div>
                  <Textarea
                    value={script?.hook || ''}
                    onChange={(e) => handleScriptFieldChange('hook', e.target.value)}
                    onBlur={(e) => handleScriptUpdate('hook', e.target.value)}
                    placeholder="Your attention-grabbing opener..."
                    className="resize-none h-16 text-sm"
                    disabled={scriptUpdating.hook}
                  />
                </div>

                {/* Main Content Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Main Value
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {script?.main_content?.length || 0} chars
                    </span>
                  </div>
                  <Textarea
                    value={script?.main_content || ''}
                    onChange={(e) => handleScriptFieldChange('main_content', e.target.value)}
                    onBlur={(e) => handleScriptUpdate('main_content', e.target.value)}
                    placeholder="Your core message and value..."
                    className="resize-none h-32 text-sm"
                    disabled={scriptUpdating.main_content}
                  />
                </div>

                {/* Call to Action Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Call to Action
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {script?.call_to_action?.length || 0} chars
                    </span>
                  </div>
                  <Textarea
                    value={script?.call_to_action || ''}
                    onChange={(e) => handleScriptFieldChange('call_to_action', e.target.value)}
                    onBlur={(e) => handleScriptUpdate('call_to_action', e.target.value)}
                    placeholder="Your engagement prompt..."
                    className="resize-none h-16 text-sm"
                    disabled={scriptUpdating.call_to_action}
                  />
                </div>

                {/* Script Actions */}
                {script?.id && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={copyFullScript}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Full Script
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-medium">Notes & Ideas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              onBlur={() => handleInputBlur("notes")}
              placeholder="Add your ideas, hooks, or notes..."
              className="resize-none h-32"
              disabled={isUpdating}
            />
          </div>

          {/* Source URL */}
          {item.source_url && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Source</Label>
              <Button
                variant="outline"
                onClick={() => window.open(item.source_url!, '_blank')}
                className="w-full justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Original Content
              </Button>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleDuplicate}
              variant="outline"
              size="sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
            
            {formData.status !== 'archived' && (
              <Button
                onClick={handleArchive}
                variant="outline"
                size="sm"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
            )}
            
            <Button
              onClick={handleDelete}
              variant="destructive"
              size="sm"
              className="ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}