import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Edit3, 
  Bookmark,
  CreditCard,
  Instagram,
  Music2,
  Calendar,
  UserCog,
  Users,
  Video,
  Hash,
  FileText
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
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarProfileSection } from "@/components/profile/SidebarProfileSection";
import { NavigationFlyout, FlyoutGroup } from "./NavigationFlyout";

// Flyout data structures
const instagramItems = [
  { title: "Hashtags", url: "/instagram-hashtags", icon: Hash, description: "Trending topics" },
  { title: "Content Creators", url: "/instagram-creators", icon: Users, description: "Find top creators" },
];

const tiktokItems = [
  { title: "Trending", url: "/viral-tiktoks", icon: Video, description: "Find standout videos" },
  { title: "Creators", url: "/tiktok-creators", icon: Users, description: "Find top creators" },
];

const savedItems = [
  { title: "Scripts", url: "/my-scripts", icon: Edit3, description: "Your saved scripts" },
  { title: "Ideas", url: "/content", icon: FileText, description: "Your saved content" },
];

// Navigation items with flyout support
const navigationItems = [
  { title: "Home", url: "/dashboard", icon: Home, tooltip: "Dashboard Home", type: "direct" },
  { title: "Instagram", icon: Instagram, tooltip: "Instagram Creators & Content", type: "flyout", flyoutData: [{ title: "Instagram", items: instagramItems }] },
  { title: "TikTok", icon: Music2, tooltip: "TikTok Creators & Content", type: "flyout", flyoutData: [{ title: "TikTok", items: tiktokItems }] },
  { title: "Saved", icon: Bookmark, tooltip: "Your Saved Content", type: "flyout", flyoutData: [{ title: "Saved", items: savedItems }] },
  { title: "Creators", url: "/creator-profiles", icon: UserCog, tooltip: "Creator Profiles", type: "direct" },
  { title: "Scripts", url: "/script-generator", icon: Edit3, tooltip: "Script Generator", type: "direct" },
  { title: "Calendar", url: "/content-calendar", icon: Calendar, tooltip: "Content Calendar", type: "direct" },
  { title: "Billing", url: "/billing", icon: CreditCard, tooltip: "Billing & Plans", type: "direct" },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Flyout state management
  const [instagramOpen, setInstagramOpen] = useState(false);
  const [tiktokOpen, setTiktokOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  const isActive = (item: typeof navigationItems[number]) => {
    if (item.type === "direct" && item.url) {
      if (item.url === "/dashboard") return currentPath === item.url;
      return currentPath.startsWith(item.url);
    }
    
    if (item.type === "flyout" && item.flyoutData) {
      return item.flyoutData[0].items.some(flyoutItem => 
        currentPath.startsWith(flyoutItem.url)
      );
    }
    
    return false;
  };

  const getFlyoutState = (item: typeof navigationItems[number]) => {
    if (item.title === "Instagram") return { open: instagramOpen, setOpen: setInstagramOpen };
    if (item.title === "TikTok") return { open: tiktokOpen, setOpen: setTiktokOpen };
    if (item.title === "Saved") return { open: savedOpen, setOpen: setSavedOpen };
    return { open: false, setOpen: () => {} };
  };

  const renderNavigationItem = (item: typeof navigationItems[number]) => {
    const active = isActive(item);
    
    if (item.type === "direct" && item.url) {
      return (
        <Tooltip key={item.title}>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-all duration-200 min-h-[60px] group text-center ${
                    active
                      ? "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.title}</span>
                </NavLink>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            {item.tooltip}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (item.type === "flyout" && item.flyoutData) {
      const { open, setOpen } = getFlyoutState(item);
      
      return (
        <NavigationFlyout
          key={item.title}
          groups={item.flyoutData as FlyoutGroup[]}
          open={open}
          onOpenChange={setOpen}
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton asChild>
                  <button
                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-all duration-200 min-h-[60px] group text-center w-full ${
                      active
                        ? "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </button>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                {item.tooltip}
              </TooltipContent>
            </Tooltip>
          }
        />
      );
    }

    return null;
  };

  return (
    <TooltipProvider>
      <Sidebar className="w-36 flex flex-col fixed left-0 top-0 h-screen z-50 bg-white dark:bg-black border-r" collapsible="none">
        <SidebarHeader className="border-b border-sidebar-border p-3">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/20438a19-0f33-4e14-ad03-f2ce206ada62.png" 
              alt="Viraltify logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 flex-1">
          <SidebarGroup className="border-none">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderNavigationItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-0 mt-auto absolute bottom-0 w-full">
          <SidebarProfileSection />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}