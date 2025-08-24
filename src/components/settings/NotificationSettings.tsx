import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail, Smartphone } from "lucide-react";

interface NotificationPreferences {
  email_notifications: {
    script_completion: boolean;
    credit_warnings: boolean;
    weekly_digest: boolean;
    feature_announcements: boolean;
    billing_reminders: boolean;
  };
  in_app_notifications: boolean;
  push_notifications: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_notifications: {
    script_completion: true,
    credit_warnings: true,
    weekly_digest: true,
    feature_announcements: true,
    billing_reminders: true,
  },
  in_app_notifications: true,
  push_notifications: false,
};

export function NotificationSettings() {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const { toast } = useToast();

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("email_notifications, in_app_notifications, push_notifications")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading preferences:", error);
        return;
      }

      if (data) {
        setPreferences({
          email_notifications: (data.email_notifications as any) || defaultPreferences.email_notifications,
          in_app_notifications: data.in_app_notifications ?? defaultPreferences.in_app_notifications,
          push_notifications: data.push_notifications ?? defaultPreferences.push_notifications,
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
          email_notifications: preferences.email_notifications,
          in_app_notifications: preferences.in_app_notifications,
          push_notifications: preferences.push_notifications,
        });

      if (error) throw error;

      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save your notification preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEmailNotification = (key: keyof NotificationPreferences['email_notifications'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      email_notifications: {
        ...prev.email_notifications,
        [key]: value,
      },
    }));
  };

  const emailNotificationOptions = [
    {
      key: 'script_completion' as const,
      label: 'Script Generation Completion',
      description: 'Get notified when your script generation is complete',
    },
    {
      key: 'credit_warnings' as const,
      label: 'Credit Balance Warnings',
      description: 'Alert when your credit balance is running low',
    },
    {
      key: 'weekly_digest' as const,
      label: 'Weekly Viral Content Digest',
      description: 'Weekly summary of trending content and insights',
    },
    {
      key: 'feature_announcements' as const,
      label: 'Feature Announcements',
      description: 'Updates about new features and improvements',
    },
    {
      key: 'billing_reminders' as const,
      label: 'Billing Reminders',
      description: 'Reminders about upcoming billing and subscription changes',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Email Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Choose which emails you'd like to receive from us.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {emailNotificationOptions.map((option) => (
            <div key={option.key} className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-base">{option.label}</Label>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <Switch
                checked={preferences.email_notifications[option.key]}
                onCheckedChange={(checked) => updateEmailNotification(option.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* In-App Notifications */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">In-App Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Control notifications that appear within the application.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base">Enable In-App Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Show notifications for important events while using the app
            </p>
          </div>
          <Switch
            checked={preferences.in_app_notifications}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, in_app_notifications: checked }))
            }
          />
        </div>
      </div>

      <Separator />

      {/* Push Notifications */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Receive notifications even when the app is closed.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Get notified on your device for important updates
            </p>
          </div>
          <Switch
            checked={preferences.push_notifications}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, push_notifications: checked }))
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