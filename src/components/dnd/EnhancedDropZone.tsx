import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Plus, ArrowDown } from 'lucide-react';

interface EnhancedDropZoneProps {
  id: string;
  children?: React.ReactNode;
  className?: string;
  placeholder?: string;
  isActive?: boolean;
  position?: 'top' | 'bottom' | 'between';
  showIndicator?: boolean;
}

export function EnhancedDropZone({ 
  id, 
  children, 
  className,
  placeholder = "Drop content here",
  isActive = false,
  position = 'bottom',
  showIndicator = true
}: EnhancedDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      accepts: ['content-item'],
      position
    }
  });

  const getDropZoneStyles = () => {
    if (position === 'between') {
      return cn(
        "h-4 transition-all duration-200 flex items-center justify-center",
        isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50",
        isOver ? "bg-red-50 border-2 border-dashed border-red-500 rounded-lg" : "",
        className
      );
    }

    return cn(
      "min-h-[60px] transition-all duration-200 rounded-lg border-2 border-dashed",
      isActive 
        ? "border-muted-foreground/40 bg-muted/30 opacity-100" 
        : "border-transparent opacity-0",
      isOver 
        ? "border-red-500 bg-red-50 shadow-lg shadow-red-500/10" 
        : "",
      className
    );
  };

  if (position === 'between') {
    return (
      <div
        ref={setNodeRef}
        className={getDropZoneStyles()}
      >
        {isOver && showIndicator && (
          <div className="w-full h-0.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={getDropZoneStyles()}
    >
      {children}
      
      {isActive && !children && (
        <div className="flex flex-col items-center justify-center text-muted-foreground py-4">
          <Plus className="w-6 h-6 mb-2" />
          <p className="text-sm font-medium">{placeholder}</p>
          {position === 'top' && (
            <ArrowDown className="w-4 h-4 mt-1 text-muted-foreground/60" />
          )}
        </div>
      )}
      
      {isOver && (
        <div className="flex items-center justify-center py-2">
          <ArrowDown className="w-6 h-6 text-red-500 animate-bounce" />
        </div>
      )}
    </div>
  );
}