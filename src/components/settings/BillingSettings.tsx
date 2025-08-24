import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, TrendingUp, Download, AlertCircle } from "lucide-react";
import { useCreditBalance } from "@/hooks/useCreditBalance";

interface CreditPreferences {
  credit_alerts: {
    low_balance_threshold: number;
    weekly_usage_summary: boolean;
  };
}

const defaultPreferences: CreditPreferences = {
  credit_alerts: {
    low_balance_threshold: 10,
    weekly_usage_summary: true,
  },
};

export function BillingSettings() {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<CreditPreferences>(defaultPreferences);
  const [usageData, setUsageData] = useState<any[]>([]);
  const { toast } = useToast();
  const creditData = useCreditBalance();

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("credit_alerts")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading preferences:", error);
        return;
      }

      if (data?.credit_alerts) {
        setPreferences({
          credit_alerts: (data.credit_alerts as any) || defaultPreferences.credit_alerts,
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const loadUsageData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("daily_credit_usage")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Error loading usage data:", error);
        return;
      }

      setUsageData(data || []);
    } catch (error) {
      console.error("Error loading usage data:", error);
    }
  };

  useEffect(() => {
    loadPreferences();
    loadUsageData();
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
          credit_alerts: preferences.credit_alerts,
        });

      if (error) throw error;

      toast({
        title: "Billing settings updated",
        description: "Your billing preferences have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save your billing preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportUsageData = () => {
    if (usageData.length === 0) {
      toast({
        title: "No data to export",
        description: "You don't have any usage data to export yet.",
      });
      return;
    }

    const csv = [
      "Date,Credits Used",
      ...usageData.map(item => `${item.date},${item.credits_used}`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credit-usage-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Usage data exported",
      description: "Your credit usage data has been downloaded.",
    });
  };

  const totalUsage = usageData.reduce((sum, item) => sum + item.credits_used, 0);
  const averageDaily = usageData.length > 0 ? totalUsage / usageData.length : 0;

  return (
    <div className="space-y-6">
      {/* Credit Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditData.balance || 0}</div>
            <p className="text-xs text-muted-foreground">
              credits remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30-Day Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              credits used ({averageDaily.toFixed(1)}/day avg)
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Credit Alerts */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Credit Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Configure when you want to be notified about credit usage.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label className="text-base">Low Balance Threshold</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your credits fall below this amount
              </p>
            </div>
            <div className="w-20">
              <Input
                type="number"
                min="1"
                max="100"
                value={preferences.credit_alerts.low_balance_threshold}
                onChange={(e) => 
                  setPreferences(prev => ({
                    ...prev,
                    credit_alerts: {
                      ...prev.credit_alerts,
                      low_balance_threshold: parseInt(e.target.value) || 10
                    }
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label className="text-base">Weekly Usage Summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly email with your credit usage summary
              </p>
            </div>
            <Switch
              checked={preferences.credit_alerts.weekly_usage_summary}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({
                  ...prev,
                  credit_alerts: {
                    ...prev.credit_alerts,
                    weekly_usage_summary: checked
                  }
                }))
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Usage Analytics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Usage Analytics</h3>
            <p className="text-sm text-muted-foreground">
              View and export your credit usage history.
            </p>
          </div>
          <Button variant="outline" onClick={exportUsageData} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {usageData.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">Recent Usage (Last 7 Days)</div>
            {usageData.slice(0, 7).map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{new Date(item.date).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {index === 0 ? "Today" : index === 1 ? "Yesterday" : `${index} days ago`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.credits_used} credits</p>
                  <div className="w-20 mt-1">
                    <Progress 
                      value={(item.credits_used / Math.max(...usageData.map(d => d.credits_used))) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No usage data available yet.</p>
            <p className="text-sm">Start using the app to see your credit usage here!</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}