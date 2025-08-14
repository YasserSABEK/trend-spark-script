import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CreditMeter } from "@/components/credits/CreditMeter";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { AppSidebar } from "./AppSidebar";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-3">
        {/* Left: Hamburger Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-10 h-10 p-0 hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-full sm:w-80 z-[100]">
            <div className="h-full bg-sidebar-background">
              <AppSidebar />
            </div>
          </SheetContent>
        </Sheet>

        {/* Center: Logo */}
        <div className="flex items-center space-x-1.5 flex-1 justify-center">
          <img 
            src="/lovable-uploads/a6a45a07-ab6a-4a98-9503-3624cff4fda0.png" 
            alt="Viraltify logo" 
            className="w-5 h-5"
          />
          <span className="text-base font-bold bg-gradient-to-r from-instagram-pink to-instagram-purple bg-clip-text text-transparent">
            Viraltify
          </span>
        </div>

        {/* Right: Profile + Credits */}
        <div className="flex items-center space-x-1">
          <CreditMeter compact={true} />
          <ProfileDropdown collapsed={true} />
        </div>
      </div>
    </header>
  );
}