import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ContentPlanCard } from './ContentPlanCard';
import { AddIdeaCard } from './AddIdeaCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ContentItem {
  id: string;
  title: string | null;
  platform: string;
  status: string;
  script_id: string | null;
  source_url: string | null;
  planned_publish_date: string | null;
  notes: string | null;
  caption: string | null;
  created_at: string;
  updated_at: string;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  items: ContentItem[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ContentItem>) => void;
  onContentCreated?: (content: ContentItem) => void;
  onCardClick?: (item: ContentItem) => void;
  defaultCollapsed?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'idea':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'scripting':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ready':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'posted':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'archived':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusTitle = (status: string) => {
  switch (status) {
    case 'idea':
      return 'Ideas';
    case 'scripting':
      return 'Scripting';
    case 'ready':
      return 'Ready to Post';
    case 'posted':
      return 'Posted';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
};

export function KanbanColumn({ id, title, items, onDelete, onUpdate, onContentCreated, onCardClick, defaultCollapsed = false }: KanbanColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  const {
    isOver,
    setNodeRef
  } = useDroppable({
    id,
  });

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[320px]">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapse}
            className="w-6 h-6 p-0 hover:bg-muted"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
          <h3 className="font-medium text-sm">{getStatusTitle(id)}</h3>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs px-2 py-0.5 ${getStatusColor(id)}`}
        >
          {items.length}
        </Badge>
      </div>

      {/* Column Content */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`flex-1 p-3 space-y-3 min-h-[200px] transition-colors ${
            isOver ? 'bg-primary/5' : 'bg-background'
          }`}
        >
          <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
            {/* Add Idea Card for Ideas column */}
            {id === 'idea' && onContentCreated && (
              <AddIdeaCard onContentCreated={onContentCreated} />
            )}
            
            {items.length === 0 && id !== 'idea' ? (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {id === 'archived' ? 'No archived content' : `Drop content here`}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <ContentPlanCard
                  key={item.id}
                  item={item}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onClick={() => onCardClick?.(item)}
                />
              ))
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}