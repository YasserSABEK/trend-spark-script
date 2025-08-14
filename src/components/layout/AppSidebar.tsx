import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Zap,
  Compass,
  Plus,
  Bot,
  Crown,
  Video, 
  Hash,
  Edit3, 
  Bookmark,
  Instagram,
  Music2,
  Users
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarProfileSection } from "@/components/profile/SidebarProfileSection";
import { cn } from "@/lib/utils";

interface NavigationItem {
  key: string;
  label: string;
  icon: any;
  route?: string;
  type: 'link' | 'flyout';
  children?: FlyoutItem[];
  description?: string;
  pinned?: boolean;
}

interface FlyoutItem {
  title: string;
  url: string;
  icon: any;
  description: string;
}

const navigationItems: NavigationItem[] = [
  { 
    key: "home", 
    label: "Home", 
    icon: Home, 
    route: "/dashboard", 
    type: "link" 
  },
  {
    key: "optimize",
    label: "Optimize",
    icon: Zap,
    type: "flyout",
    children: [
      { 
        title: "Script Generator", 
        url: "/script-generator", 
        icon: Edit3, 
        description: "Generate scripts" 
      },
      { 
        title: "Saved Content", 
        url: "/content", 
        icon: Bookmark, 
        description: "Your saved videos" 
      },
    ]
  },
  {
    key: "discover",
    label: "Discover",
    icon: Compass,
    type: "flyout",
    children: [
      { 
        title: "Instagram Creators", 
        url: "/instagram-creators", 
        icon: Users, 
        description: "Find top creators" 
      },
      { 
        title: "Viral Reels", 
        url: "/viral-reels", 
        icon: Video, 
        description: "Find standout videos" 
      },
      { 
        title: "Instagram Hashtags", 
        url: "/instagram-hashtags", 
        icon: Hash, 
        description: "Trending topics" 
      },
      { 
        title: "TikTok Creators", 
        url: "/tiktok-creators", 
        icon: Users, 
        description: "Find top creators" 
      },
      { 
        title: "Viral TikToks", 
        url: "/viral-tiktoks", 
        icon: Video, 
        description: "Find standout videos" 
      },
      { 
        title: "TikTok Hashtags", 
        url: "/hashtag-search", 
        icon: Hash, 
        description: "Trending topics" 
      },
    ]
  },
  { 
    key: "create", 
    label: "Create", 
    icon: Plus, 
    route: "/content-calendar", 
    type: "link" 
  },
  { 
    key: "coach", 
    label: "AI Coach", 
    icon: Bot, 
    route: "/coach", 
    type: "link" 
  },
  { 
    key: "upgrade", 
    label: "Upgrade", 
    icon: Crown, 
    route: "/billing", 
    type: "link", 
    pinned: true 
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);

  const isActive = (path: string) => currentPath === path;
  
  const isGroupActive = (children?: FlyoutItem[]) => {
    return children?.some(item => isActive(item.url)) || false;
  };

  const handleFlyoutToggle = (key: string) => {
    setOpenFlyout(openFlyout === key ? null : key);
  };

  const regularItems = navigationItems.filter(item => !item.pinned);
  const pinnedItems = navigationItems.filter(item => item.pinned);

  const renderNavigationItem = (item: NavigationItem) => {
    if (item.type === "link") {
      return (
        <SidebarMenuItem key={item.key}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.route!}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center h-16 w-full rounded-lg transition-colors",
                  collapsed ? "px-2" : "px-4",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                )
              }
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className={cn("text-xs", collapsed && "sr-only")}>{item.label}</span>
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    // Flyout items
    const hasActiveChild = isGroupActive(item.children);
    
    return (
      <SidebarMenuItem key={item.key}>
        <Popover 
          open={openFlyout === item.key} 
          onOpenChange={(open) => setOpenFlyout(open ? item.key : null)}
        >
          <PopoverTrigger asChild>
            <SidebarMenuButton
              className={cn(
                "flex flex-col items-center justify-center h-16 w-full rounded-lg transition-colors",
                collapsed ? "px-2" : "px-4",
                hasActiveChild
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
              )}
              onClick={() => handleFlyoutToggle(item.key)}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className={cn("text-xs", collapsed && "sr-only")}>{item.label}</span>
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent 
            side="right" 
            className={cn(
              "p-4 w-80 ml-2",
              item.key === "discover" && "w-96"
            )}
            align="start"
          >
            <div className="space-y-2">
              <h3 className="font-semibold text-lg mb-4">{item.label}</h3>
              {item.key === "discover" ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </h4>
                    <div className="space-y-2">
                      {item.children?.slice(0, 3).map((child) => (
                        <NavLink
                          key={child.title}
                          to={child.url}
                          onClick={() => setOpenFlyout(null)}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-accent/50"
                            )
                          }
                        >
                          <child.icon className="w-5 h-5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{child.title}</div>
                            <div className="text-sm text-muted-foreground">{child.description}</div>
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Music2 className="w-4 h-4" />
                      TikTok
                    </h4>
                    <div className="space-y-2">
                      {item.children?.slice(3).map((child) => (
                        <NavLink
                          key={child.title}
                          to={child.url}
                          onClick={() => setOpenFlyout(null)}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-accent/50"
                            )
                          }
                        >
                          <child.icon className="w-5 h-5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{child.title}</div>
                            <div className="text-sm text-muted-foreground">{child.description}</div>
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {item.children?.map((child) => (
                    <NavLink
                      key={child.title}
                      to={child.url}
                      onClick={() => setOpenFlyout(null)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "hover:bg-sidebar-accent/50"
                        )
                      }
                    >
                      <child.icon className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{child.title}</div>
                        <div className="text-sm text-muted-foreground">{child.description}</div>
                      </div>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-20"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-center">
          <img 
            src="/lovable-uploads/a6a45a07-ab6a-4a98-9503-3624cff4fda0.png" 
            alt="Viraltify logo" 
            className="w-8 h-8"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {regularItems.map(renderNavigationItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-2">
        <SidebarMenu>
          {pinnedItems.map(renderNavigationItem)}
        </SidebarMenu>
        <SidebarProfileSection collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}