import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Edit3, 
  Bookmark,
  CreditCard,
  Instagram,
  Music2,
  Calendar,
  UserCog
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

const navigationItems = [
  { title: "Home", url: "/dashboard", icon: Home, tooltip: "Dashboard Home" },
  { title: "Instagram", url: "/instagram-creators", icon: Instagram, tooltip: "Instagram Creators & Content" },
  { title: "TikTok", url: "/tiktok-creators", icon: Music2, tooltip: "TikTok Creators & Content" },
  { title: "Saved", url: "/saved-creators", icon: Bookmark, tooltip: "Your Saved Content" },
  { title: "Creators", url: "/creator-profiles", icon: UserCog, tooltip: "Creator Profiles" },
  { title: "Scripts", url: "/script-generator", icon: Edit3, tooltip: "Script Generator" },
  { title: "Calendar", url: "/content-calendar", icon: Calendar, tooltip: "Content Calendar" },
  { title: "Billing", url: "/billing", icon: CreditCard, tooltip: "Billing & Plans" },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/dashboard") return currentPath === path;
    return currentPath.startsWith(path);
  };

  return (
    <TooltipProvider>
      <Sidebar className="w-18" collapsible="none">
        <SidebarHeader className="border-b border-sidebar-border p-3">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/20438a19-0f33-4e14-ad03-f2ce206ada62.png" 
              alt="Viraltify logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup className="border-none">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            className={`flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg transition-all duration-200 min-h-[56px] group ${
                              isActive(item.url)
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-2xs font-medium text-center leading-tight">{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="ml-2">
                        {item.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-0">
          <SidebarProfileSection />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}