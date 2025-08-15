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
  FileText,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SidebarProfileSection } from "@/components/profile/SidebarProfileSection";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigationItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Script Generator", url: "/script-generator", icon: Edit3 },
  { title: "Content Calendar", url: "/content-calendar", icon: Calendar },
  { title: "Billing", url: "/billing", icon: CreditCard },
];

const instagramItems = [
  { title: "Creators", url: "/instagram-creators", icon: Users, description: "Find top creators" },
  { title: "Viral Reels", url: "/viral-reels", icon: Video, description: "Find standout videos" },
  { title: "Hashtags", url: "/instagram-hashtags", icon: Hash, description: "Trending topics" },
];

const tiktokItems = [
  { title: "Creators", url: "/tiktok-creators", icon: Users, description: "Find top creators" },
  { title: "Viral Videos", url: "/viral-tiktoks", icon: Video, description: "Find standout videos" },
  { title: "Hashtags", url: "/hashtag-search", icon: Hash, description: "Trending topics" },
];

const savedItems = [
  { title: "Saved Content", url: "/content", icon: FileText, description: "Your saved videos" },
  { title: "Saved Creators", url: "/saved-creators", icon: Users, description: "Your saved creators" },
];

interface MobileSidebarProps {
  onClose?: () => void;
}

export function MobileSidebar({ onClose }: MobileSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    instagram: false,
    tiktok: false,
    saved: false,
  });

  const isActive = (path: string) => currentPath === path;
  
  const isGroupActive = (items: typeof instagramItems) => {
    return items.some(item => isActive(item.url));
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/20438a19-0f33-4e14-ad03-f2ce206ada62.png" 
            alt="Viraltify logo" 
            className="h-12 w-auto max-w-[140px] object-contain"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Main Navigation */}
        {navigationItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted text-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}

        {/* Instagram Section */}
        <Collapsible open={openSections.instagram} onOpenChange={() => toggleSection("instagram")}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start h-auto px-3 py-3 ${
                isGroupActive(instagramItems)
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted"
              }`}
            >
              <Instagram className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">Instagram</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${openSections.instagram ? "rotate-90" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-4 mt-1">
            {instagramItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* TikTok Section */}
        <Collapsible open={openSections.tiktok} onOpenChange={() => toggleSection("tiktok")}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start h-auto px-3 py-3 ${
                isGroupActive(tiktokItems)
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted"
              }`}
            >
              <Music2 className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">TikTok</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${openSections.tiktok ? "rotate-90" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-4 mt-1">
            {tiktokItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Saved Section */}
        <Collapsible open={openSections.saved} onOpenChange={() => toggleSection("saved")}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start h-auto px-3 py-3 ${
                isGroupActive(savedItems)
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted"
              }`}
            >
              <Bookmark className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">Saved</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${openSections.saved ? "rotate-90" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-4 mt-1">
            {savedItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <SidebarProfileSection collapsed={false} />
      </div>
    </div>
  );
}