import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Video, 
  Edit3, 
  FileText, 
  Database, 
  BarChart3, 
  Settings,
  Zap,
  CreditCard
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

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Viral Reels", url: "/viral-reels", icon: Video },
  { title: "Script Generator", url: "/script-generator", icon: Edit3 },
  { title: "My Scripts", url: "/my-scripts", icon: FileText },
  { title: "Instagram Data", url: "/instagram-data", icon: Database },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center space-x-2 p-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
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