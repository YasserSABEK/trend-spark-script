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
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left: Hamburger Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 pl-0 w-72">
            <div className="h-full">
              <AppSidebar />
            </div>
          </SheetContent>
        </Sheet>

        {/* Center: Logo */}
        <div className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/a6a45a07-ab6a-4a98-9503-3624cff4fda0.png" 
            alt="Viraltify logo" 
            className="w-6 h-6"
          />
          <span className="text-lg font-bold bg-gradient-to-r from-instagram-pink to-instagram-purple bg-clip-text text-transparent">
            Viraltify
          </span>
        </div>

        {/* Right: Profile + Credits */}
        <div className="flex items-center space-x-2">
          <CreditMeter />
          <ProfileDropdown collapsed={true} />
        </div>
      </div>
    </header>
  );
}