import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Layout, Monitor, Sidebar } from "lucide-react";

interface WorkspacePreferences {
  dashboard_layout: string;
  sidebar_collapsed: boolean;
}

const defaultPreferences: WorkspacePreferences = {
  dashboard_layout: "default",
  sidebar_collapsed: false,
};

export function WorkspaceSettings() {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<WorkspacePreferences>(defaultPreferences);
  const { toast } = useToast();

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("dashboard_layout, sidebar_collapsed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading preferences:", error);
        return;
      }

      if (data) {
        setPreferences({
          dashboard_layout: data.dashboard_layout || defaultPreferences.dashboard_layout,
          sidebar_collapsed: data.sidebar_collapsed ?? defaultPreferences.sidebar_collapsed,
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const savePreferences = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          dashboard_layout: preferences.dashboard_layout,
          sidebar_collapsed: preferences.sidebar_collapsed,
        });

      if (error) throw error;

      toast({
        title: "Workspace settings updated",
        description: "Your workspace preferences have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save your workspace preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const layoutOptions = [
    {
      value: "default",
      label: "Default Layout",
      description: "Standard dashboard with all widgets visible",
    },
    {
      value: "compact",
      label: "Compact Layout",
      description: "Condensed view with smaller widgets",
    },
    {
      value: "focus",
      label: "Focus Mode",
      description: "Minimal layout highlighting key metrics",
    },
    {
      value: "analytics",
      label: "Analytics First",
      description: "Layout optimized for data analysis",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Layout */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Layout className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Dashboard Layout</h3>
            <p className="text-sm text-muted-foreground">
              Customize how your dashboard is organized and displayed.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-base">Layout Style</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Choose how you want your dashboard to be arranged
            </p>
            <Select
              value={preferences.dashboard_layout}
              onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, dashboard_layout: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {layoutOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-sm text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Sidebar Preferences */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sidebar className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Sidebar Settings</h3>
            <p className="text-sm text-muted-foreground">
              Configure how the navigation sidebar behaves.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base">Start with Collapsed Sidebar</Label>
            <p className="text-sm text-muted-foreground">
              Begin each session with the sidebar collapsed to maximize content space
            </p>
          </div>
          <Switch
            checked={preferences.sidebar_collapsed}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, sidebar_collapsed: checked }))
            }
          />
        </div>
      </div>

      <Separator />

      {/* Display Preferences */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Monitor className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Display Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Optimize the interface for your screen and workflow.
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Coming Soon:</p>
            <ul className="space-y-1 text-sm">
              <li>• Custom widget arrangement</li>
              <li>• Adjustable panel sizes</li>
              <li>• Quick access toolbar customization</li>
              <li>• Keyboard shortcuts configuration</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}