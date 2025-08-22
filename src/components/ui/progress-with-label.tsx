import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressWithLabelProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: "default" | "instagram";
  height?: "sm" | "default" | "lg";
}

const ProgressWithLabel = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressWithLabelProps
>(({ className, value, label, showPercentage = false, variant = "default", height = "default", ...props }, ref) => {
  const heightClasses = {
    sm: "h-1.5",
    default: "h-4", 
    lg: "h-6"
  };

  const getProgressBackground = () => {
    if (variant === "instagram") {
      return "bg-gradient-to-r from-[#F9A8D4] to-[#EC4899]";
    }
    return "bg-gradient-to-r from-primary via-primary/80 to-primary";
  };

  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-xs text-gray-500">{label}</span>
          )}
          {showPercentage && (
            <span className="text-xs text-gray-500">{Math.round(value || 0)}%</span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          heightClasses[height],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out",
            getProgressBackground()
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})

ProgressWithLabel.displayName = "ProgressWithLabel"

export { ProgressWithLabel }