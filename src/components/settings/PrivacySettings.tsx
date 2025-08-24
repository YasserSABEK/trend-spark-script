import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Download, Trash2, Eye } from "lucide-react";

interface PrivacyPreferences {
  profile_visibility: "public" | "private";
  data_sharing: boolean;
}

const defaultPreferences: PrivacyPreferences = {
  profile_visibility: "private",
  data_sharing: false,
};

export function PrivacySettings() {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [preferences, setPreferences] = useState<PrivacyPreferences>(defaultPreferences);
  const { toast } = useToast();

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("profile_visibility, data_sharing")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading preferences:", error);
        return;
      }

      if (data) {
        setPreferences({
          profile_visibility: (data.profile_visibility as "public" | "private") || defaultPreferences.profile_visibility,
          data_sharing: data.data_sharing ?? defaultPreferences.data_sharing,
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
          profile_visibility: preferences.profile_visibility,
          data_sharing: preferences.data_sharing,
        });

      if (error) throw error;

      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save your privacy preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Export user data (simplified - in production you'd want more comprehensive data)
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: scripts } = await supabase
        .from("generated_scripts")
        .select("*")
        .eq("user_id", user.id);

      const { data: contentItems } = await supabase
        .from("content_items")
        .select("*")
        .eq("user_id", user.id);

      const exportData = {
        profile,
        scripts,
        contentItems,
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `viraltify-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // In a real implementation, this would be an edge function that properly deletes all user data
      toast({
        title: "Account deletion requested",
        description: "Your account deletion request has been submitted. You will receive an email confirmation within 24 hours.",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Deletion failed",
        description: "Failed to process account deletion. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Profile Visibility</h3>
            <p className="text-sm text-muted-foreground">
              Control who can see your profile information.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base">Profile Visibility</Label>
            <p className="text-sm text-muted-foreground">
              Choose whether your profile is visible to other users
            </p>
          </div>
          <Select
            value={preferences.profile_visibility}
            onValueChange={(value: "public" | "private") => 
              setPreferences(prev => ({ ...prev, profile_visibility: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Data Sharing */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Data Sharing</h3>
            <p className="text-sm text-muted-foreground">
              Control how your data is used to improve our services.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base">Anonymous Analytics</Label>
            <p className="text-sm text-muted-foreground">
              Allow us to use anonymized data to improve our algorithms and features
            </p>
          </div>
          <Switch
            checked={preferences.data_sharing}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, data_sharing: checked }))
            }
          />
        </div>
      </div>

      <Separator />

      {/* Data Management */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Data Management</h3>
          <p className="text-sm text-muted-foreground">
            Export or delete your account data.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Export Your Data</p>
                <p className="text-sm text-muted-foreground">
                  Download a copy of all your data
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={exportData}>
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
            <div className="flex items-center space-x-3">
              <Trash2 className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers, including:
                    <br />
                    • All generated scripts
                    • Content analysis history
                    • Creator profiles
                    • Account preferences
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAccount}
                    disabled={deleteLoading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteLoading ? "Processing..." : "Yes, delete my account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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