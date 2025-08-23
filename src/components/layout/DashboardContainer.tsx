import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardContainerProps {
  children: ReactNode;
  className?: string;
}

export function DashboardContainer({ 
  children, 
  className 
}: DashboardContainerProps) {
  return (
    <div className={cn(
      "min-h-screen bg-gradient-canva p-6",
      className
    )}>
      <div className="max-w-7xl mx-auto space-y-8">
        {children}
      </div>
    </div>
  );
}