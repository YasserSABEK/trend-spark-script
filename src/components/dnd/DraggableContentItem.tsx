import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, CalendarClock, BookmarkCheck, GripVertical } from 'lucide-react';

interface ContentItem {
  id: string;
  user_id: string;
  platform: string;
  source_url: string;
  source_post_id: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  status: string;
  scheduled_at: string | null;
  notes: string | null;
  color: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface DraggableContentItemProps {
  item: ContentItem;
  onOpenSource: (url: string) => void;
}

export function DraggableContentItem({ item, onOpenSource }: DraggableContentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: item.id,
    data: {
      type: 'content-item',
      item: item,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`overflow-hidden transition-all duration-200 ${
        isDragging ? 'shadow-lg ring-2 ring-primary ring-opacity-50' : 'hover:shadow-md'
      }`}
    >
      <CardHeader className="pb-2 relative">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base line-clamp-1 pr-8">
            {item.caption || `${item.platform} post`}
          </CardTitle>
          <GripVertical className="w-4 h-4 text-muted-foreground absolute top-2 right-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-[9/16] bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt={`Thumbnail of ${item.platform} post`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookmarkCheck className="w-5 h-5" />
              <span>No thumbnail</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {item.tags?.slice(0, 3).map((t, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">#{t}</Badge>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarClock className="w-3 h-3" />
          <span>Saved {new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            onOpenSource(item.source_url);
          }}
          variant="outline"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Post
        </Button>
      </CardFooter>
    </Card>
  );
}