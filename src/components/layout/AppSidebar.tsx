import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Video, 
  Hash,
  Edit3, 
  Bookmark,
  CreditCard,
  Instagram,
  Music2,
  Calendar,
  Users,
  FileText
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarProfileSection } from "@/components/profile/SidebarProfileSection";
import { NavigationFlyout, FlyoutGroup } from "./NavigationFlyout";

const navigationItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Script Generator", url: "/script-generator", icon: Edit3 },
  { title: "Content Calendar", url: "/content-calendar", icon: Calendar },
  { title: "Billing", url: "/billing", icon: CreditCard },
];

const savedFlyoutGroups: FlyoutGroup[] = [
  {
    title: "Saved",
    items: [
      { title: "Saved Content", url: "/content", icon: FileText, description: "Your saved videos" },
      { title: "Saved Creators", url: "/saved-creators", icon: Users, description: "Your saved creators" },
    ]
  }
];

const instagramFlyoutGroups: FlyoutGroup[] = [
  {
    title: "Instagram",
    items: [
      { title: "Creators", url: "/instagram-creators", icon: Users, description: "Find top creators" },
      { title: "Viral Reels", url: "/viral-reels", icon: Video, description: "Find standout videos" },
      { title: "Hashtags", url: "/instagram-hashtags", icon: Hash, description: "Trending topics" },
    ]
  }
];

const tiktokFlyoutGroups: FlyoutGroup[] = [
  {
    title: "TikTok", 
    items: [
      { title: "Creators", url: "/tiktok-creators", icon: Users, description: "Find top creators" },
      { title: "Viral Videos", url: "/viral-tiktoks", icon: Video, description: "Find standout videos" },
      { title: "Hashtags", url: "/hashtag-search", icon: Hash, description: "Trending topics" },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [openFlyouts, setOpenFlyouts] = useState<Record<string, boolean>>({});

  const isActive = (path: string) => currentPath === path;
  
  const isGroupActive = (groups: FlyoutGroup[]) => {
    return groups.some(group => 
      group.items.some(item => isActive(item.url))
    );
  };

  const handleFlyoutChange = (key: string, open: boolean) => {
    setOpenFlyouts(prev => ({ ...prev, [key]: open }));
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center space-x-2 p-2">
          <img 
            src="/lovable-uploads/a6a45a07-ab6a-4a98-9503-3624cff4fda0.png" 
            alt="Viraltify logo" 
            className="w-8 h-8"
          />
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-instagram-pink to-instagram-purple bg-clip-text text-transparent">
              Viraltify
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Regular navigation items */}
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Saved flyout */}
              <SidebarMenuItem>
                <NavigationFlyout
                  trigger={
                    <SidebarMenuButton
                      className={`w-full justify-start ${
                        isGroupActive(savedFlyoutGroups)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <Bookmark className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="flex-1 text-left">Saved</span>}
                    </SidebarMenuButton>
                  }
                  groups={savedFlyoutGroups}
                  open={openFlyouts.saved || false}
                  onOpenChange={(open) => handleFlyoutChange("saved", open)}
                />
              </SidebarMenuItem>

              {/* Instagram flyout */}
              <SidebarMenuItem>
                <NavigationFlyout
                  trigger={
                    <SidebarMenuButton
                      className={`w-full justify-start ${
                        isGroupActive(instagramFlyoutGroups)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <Instagram className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="flex-1 text-left">Instagram</span>}
                    </SidebarMenuButton>
                  }
                  groups={instagramFlyoutGroups}
                  open={openFlyouts.instagram || false}
                  onOpenChange={(open) => handleFlyoutChange("instagram", open)}
                />
              </SidebarMenuItem>

              {/* TikTok flyout */}
              <SidebarMenuItem>
                <NavigationFlyout
                  trigger={
                    <SidebarMenuButton
                      className={`w-full justify-start ${
                        isGroupActive(tiktokFlyoutGroups)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <Music2 className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="flex-1 text-left">TikTok</span>}
                    </SidebarMenuButton>
                  }
                  groups={tiktokFlyoutGroups}
                  open={openFlyouts.tiktok || false}
                  onOpenChange={(open) => handleFlyoutChange("tiktok", open)}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-0">
        <SidebarProfileSection collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}