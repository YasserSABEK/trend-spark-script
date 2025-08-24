import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { ContentSettings } from "@/components/settings/ContentSettings";
import { WorkspaceSettings } from "@/components/settings/WorkspaceSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { Settings as SettingsIcon, User, Bell, Shield, FileText, Layout, CreditCard } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");

  const settingsTabs = [
    {
      id: "account",
      label: "Account",
      icon: User,
      component: AccountSettings,
      description: "Manage your profile and personal preferences"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      component: NotificationSettings,
      description: "Configure email and in-app notifications"
    },
    {
      id: "privacy",
      label: "Privacy & Security",
      icon: Shield,
      component: PrivacySettings,
      description: "Control your privacy and security settings"
    },
    {
      id: "content",
      label: "Content & Analysis",
      icon: FileText,
      component: ContentSettings,
      description: "Set preferences for content analysis and generation"
    },
    {
      id: "workspace",
      label: "Workspace",
      icon: Layout,
      component: WorkspaceSettings,
      description: "Customize your workspace layout and experience"
    },
    {
      id: "billing",
      label: "Billing & Credits",
      icon: CreditCard,
      component: BillingSettings,
      description: "Manage billing, credits, and usage"
    }
  ];

  return (
    <PageContainer maxWidth="7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and application settings
            </p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex flex-col gap-1 h-auto py-3 px-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {settingsTabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <tab.icon className="h-5 w-5" />
                      {tab.label}
                    </CardTitle>
                    <CardDescription>{tab.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Component />
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </PageContainer>
  );
}