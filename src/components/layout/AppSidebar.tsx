import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Video, 
  Hash,
  Edit3, 
  Bookmark,
  CreditCard,
  Instagram,
  Music2,
  Calendar,
  ChevronRight
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarProfileSection } from "@/components/profile/SidebarProfileSection";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Instagram",
    icon: Instagram,
    items: [
      { title: "Instagram Creators", url: "/instagram-creators", icon: Instagram },
      { title: "Viral Reels", url: "/viral-reels", icon: Video },
      { title: "Hashtags", url: "/instagram-hashtags", icon: Hash },
    ]
  },
  {
    title: "TikTok",
    icon: Music2,
    items: [
      { title: "TikTok Creators", url: "/tiktok-creators", icon: Music2 },
      { title: "Viral Videos", url: "/viral-tiktoks", icon: Video },
      { title: "Hashtags", url: "/hashtag-search", icon: Hash },
    ]
  },
  { title: "Script Generator", url: "/script-generator", icon: Edit3 },
  { title: "Saved Content", url: "/content", icon: Bookmark },
  { title: "Content Calendar", url: "/content-calendar", icon: Calendar },
  { title: "Billing", url: "/billing", icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const isActive = (path: string) => currentPath === path;
  
  const isGroupActive = (items: any[]) => {
    return items?.some(item => isActive(item.url));
  };

  const handleGroupHover = (groupTitle: string, isEntering: boolean) => {
    if (collapsed) return; // Don't handle hover when collapsed
    
    setOpenGroups(prev => {
      if (isEntering) {
        return prev.includes(groupTitle) ? prev : [...prev, groupTitle];
      } else {
        return prev.filter(title => title !== groupTitle);
      }
    });
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
              {navigationItems.map((item) => {
                // Handle dropdown items (Instagram, TikTok)
                if (item.items) {
                  const isGroupExpanded = openGroups.includes(item.title);
                  const hasActiveChild = isGroupActive(item.items);
                  
                  return (
                    <Collapsible
                      key={item.title}
                      open={isGroupExpanded}
                      onOpenChange={(open) => {
                        setOpenGroups(prev => 
                          open 
                            ? [...prev.filter(t => t !== item.title), item.title]
                            : prev.filter(t => t !== item.title)
                        );
                      }}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={`group/collapsible ${
                              hasActiveChild 
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                                : "hover:bg-sidebar-accent/50"
                            }`}
                            onMouseEnter={() => handleGroupHover(item.title, true)}
                            onMouseLeave={() => handleGroupHover(item.title, false)}
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && (
                              <>
                                <span className="flex-1">{item.title}</span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${isGroupExpanded ? 'rotate-90' : ''}`} />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!collapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink
                                      to={subItem.url}
                                      className={({ isActive }) =>
                                        `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                                          isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                                        }`
                                      }
                                    >
                                      <subItem.icon className="w-4 h-4 flex-shrink-0" />
                                      <span>{subItem.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Handle single items
                return (
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
                );
              })}
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