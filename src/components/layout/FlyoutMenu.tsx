import { useState, useRef, useEffect, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";

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

interface FlyoutMenuProps {
  trigger: ReactNode;
  groups: FlyoutGroup[];
  isActive?: boolean;
  onNavigate?: () => void;
}

export function FlyoutMenu({ trigger, groups, isActive = false, onNavigate }: FlyoutMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigate = () => {
    setIsOpen(false);
    onNavigate?.();
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        flyoutRef.current &&
        triggerRef.current &&
        !flyoutRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Calculate flyout position
  const getFlyoutPosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.right + 8, // 8px gap from sidebar
    };
  };

  const position = getFlyoutPosition();

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={`relative ${isOpen ? 'bg-accent/50' : ''}`}
      >
        {trigger}
      </div>

      {/* Portal flyout menu */}
      {isOpen && createPortal(
        <div
          ref={flyoutRef}
          className="fixed bg-popover border border-border rounded-lg shadow-lg p-4 w-80 z-[1000] animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
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
                      onClick={handleNavigate}
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
        </div>,
        document.body
      )}
    </>
  );
}