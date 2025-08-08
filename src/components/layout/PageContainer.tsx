import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full";
}

export function PageContainer({ 
  children, 
  className, 
  maxWidth = "7xl" 
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "7xl": "max-w-7xl",
    full: "max-w-full"
  };

  return (
    <div className={cn(
      "mx-auto px-4 py-6 space-y-6",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}