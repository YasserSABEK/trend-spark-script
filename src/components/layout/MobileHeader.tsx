import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CreditMeter } from "@/components/credits/CreditMeter";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { MobileSidebar } from "./MobileSidebar";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-3">
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
            <MobileSidebar onClose={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Center: Logo */}
        <div className="flex items-center flex-1 justify-center min-w-0">
          <img 
            src="/lovable-uploads/20438a19-0f33-4e14-ad03-f2ce206ada62.png" 
            alt="Viraltify logo" 
            className="h-10 w-auto max-w-[120px] shrink-0 object-contain"
          />
        </div>

        {/* Right: Profile + Credits */}
        <div className="flex items-center space-x-1 shrink-0">
          <CreditMeter compact={true} />
          <ProfileDropdown collapsed={true} />
        </div>
      </div>
    </header>
  );
}