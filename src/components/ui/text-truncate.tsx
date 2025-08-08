import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TextTruncateProps {
  children: React.ReactNode;
  className?: string;
  lines?: 1 | 2 | 3 | 4;
  showTooltip?: boolean;
  tooltipContent?: string;
}

export function TextTruncate({ 
  children, 
  className, 
  lines = 1, 
  showTooltip = true,
  tooltipContent 
}: TextTruncateProps) {
  const lineClampClasses = {
    1: "line-clamp-1",
    2: "line-clamp-2", 
    3: "line-clamp-3",
    4: "line-clamp-4"
  };

  const textElement = (
    <div className={cn(
      lineClampClasses[lines],
      "overflow-hidden text-ellipsis",
      className
    )}>
      {children}
    </div>
  );

  if (!showTooltip) {
    return textElement;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {textElement}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltipContent || children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}