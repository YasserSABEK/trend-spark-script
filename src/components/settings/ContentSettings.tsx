import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Zap, Video } from "lucide-react";

interface ContentPreferences {
  default_analysis_depth: "quick" | "standard" | "deep";
  preferred_platforms: string[];
  auto_save_scripts: boolean;
}

const defaultPreferences: ContentPreferences = {
  default_analysis_depth: "standard",
  preferred_platforms: ["tiktok", "instagram"],
  auto_save_scripts: true,
};

export function ContentSettings() {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<ContentPreferences>(defaultPreferences);
  const { toast } = useToast();

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("default_analysis_depth, preferred_platforms, auto_save_scripts")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading preferences:", error);
        return;
      }

      if (data) {
        setPreferences({
          default_analysis_depth: (data.default_analysis_depth as "quick" | "standard" | "deep") || defaultPreferences.default_analysis_depth,
          preferred_platforms: data.preferred_platforms || defaultPreferences.preferred_platforms,
          auto_save_scripts: data.auto_save_scripts ?? defaultPreferences.auto_save_scripts,
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
          default_analysis_depth: preferences.default_analysis_depth,
          preferred_platforms: preferences.preferred_platforms,
          auto_save_scripts: preferences.auto_save_scripts,
        });

      if (error) throw error;

      toast({
        title: "Content settings updated",
        description: "Your content preferences have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save your content preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const platforms = [
    { id: "tiktok", label: "TikTok", description: "Short-form vertical videos" },
    { id: "instagram", label: "Instagram Reels", description: "Instagram's short video format" },
    { id: "youtube", label: "YouTube Shorts", description: "YouTube's short-form content" },
    { id: "twitter", label: "Twitter/X", description: "Text and video content" },
  ];

  const analysisDepthOptions = [
    {
      value: "quick" as const,
      label: "Quick Analysis",
      description: "Fast basic analysis (1-2 credits)",
      icon: Zap,
    },
    {
      value: "standard" as const,
      label: "Standard Analysis",
      description: "Comprehensive analysis (3-5 credits)",
      icon: FileText,
    },
    {
      value: "deep" as const,
      label: "Deep Analysis",
      description: "Detailed analysis with insights (8-10 credits)",
      icon: Video,
    },
  ];

  const togglePlatform = (platformId: string) => {
    setPreferences(prev => ({
      ...prev,
      preferred_platforms: prev.preferred_platforms.includes(platformId)
        ? prev.preferred_platforms.filter(p => p !== platformId)
        : [...prev.preferred_platforms, platformId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Analysis Preferences */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Analysis Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Set your default preferences for content analysis.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-base">Default Analysis Depth</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Choose the default level of analysis for new content
            </p>
            <div className="grid gap-3">
              {analysisDepthOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      preferences.default_analysis_depth === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setPreferences(prev => ({ ...prev, default_analysis_depth: option.value }))}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      preferences.default_analysis_depth === option.value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Platform Preferences */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Video className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Platform Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Select your preferred social media platforms for content creation.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {platforms.map((platform) => (
            <div key={platform.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={platform.id}
                checked={preferences.preferred_platforms.includes(platform.id)}
                onCheckedChange={() => togglePlatform(platform.id)}
              />
              <div className="flex-1">
                <Label htmlFor={platform.id} className="font-medium cursor-pointer">
                  {platform.label}
                </Label>
                <p className="text-sm text-muted-foreground">{platform.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Script Management */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Script Management</h3>
          <p className="text-sm text-muted-foreground">
            Configure how scripts are handled and saved.
          </p>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base">Auto-save Generated Scripts</Label>
            <p className="text-sm text-muted-foreground">
              Automatically save all generated scripts to your library
            </p>
          </div>
          <Switch
            checked={preferences.auto_save_scripts}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, auto_save_scripts: checked }))
            }
          />
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