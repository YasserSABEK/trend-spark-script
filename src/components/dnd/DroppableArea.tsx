import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Upload, FileVideo } from 'lucide-react';

interface DroppableAreaProps {
  id: string;
  children?: React.ReactNode;
  className?: string;
  acceptedTypes?: string[];
  placeholder?: string;
  icon?: React.ReactNode;
}

export function DroppableArea({ 
  id, 
  children, 
  className, 
  acceptedTypes = ['content-item'],
  placeholder = "Drop content here",
  icon
}: DroppableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      accepts: acceptedTypes,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-h-[120px] rounded-lg border-2 border-dashed transition-all duration-200",
        isOver 
          ? "border-primary bg-primary/5 shadow-lg" 
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        className
      )}
    >
      {children}
      
      {!children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          {icon || <FileVideo className="w-8 h-8 mb-2" />}
          <p className="text-sm font-medium">{placeholder}</p>
          <p className="text-xs">Drag a video from your content library</p>
        </div>
      )}
      
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-2 text-primary animate-bounce" />
            <p className="text-primary font-semibold">Drop to analyze content</p>
          </div>
        </div>
      )}
    </div>
  );
}