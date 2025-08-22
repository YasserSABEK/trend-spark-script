import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface FlyoutItem {
  title: string;
  url: string;
  icon: LucideIcon;
  description?: string;
}

export interface FlyoutGroup {
  title: string;
  items: FlyoutItem[];
}

interface NavigationFlyoutProps {
  trigger: ReactNode;
  groups: FlyoutGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavigationFlyout({ trigger, groups, open, onOpenChange }: NavigationFlyoutProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 bg-popover border shadow-md z-50" 
        side="right" 
        align="start"
        sideOffset={12}
      >
        <div className="space-y-4">
          {groups.map((group, groupIndex) => (
            <div key={group.title}>
              {groups.length > 1 && (
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  {group.title}
                </h4>
              )}
              <div className="grid gap-2">
                {group.items.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    onClick={() => onOpenChange(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-accent ${
                        isActive ? "bg-accent text-accent-foreground" : ""
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                  </NavLink>
                ))}
              </div>
              {groupIndex < groups.length - 1 && <div className="border-t my-3" />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}