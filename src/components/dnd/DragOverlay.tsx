import { DragOverlay } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookmarkCheck } from 'lucide-react';

interface ContentItem {
  id: string;
  platform: string;
  caption: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
}

interface ContentDragOverlayProps {
  activeItem: ContentItem | null;
}

export function ContentDragOverlay({ activeItem }: ContentDragOverlayProps) {
  if (!activeItem) return null;

  return (
    <DragOverlay>
      <Card className="w-64 shadow-2xl ring-2 ring-primary ring-opacity-50 rotate-3 transform scale-105">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm line-clamp-1">
            {activeItem.caption || `${activeItem.platform} post`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="aspect-[9/16] bg-muted rounded-md overflow-hidden flex items-center justify-center">
            {activeItem.thumbnail_url ? (
              <img
                src={activeItem.thumbnail_url}
                alt={`Thumbnail of ${activeItem.platform} post`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookmarkCheck className="w-4 h-4" />
                <span className="text-xs">No thumbnail</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {activeItem.tags?.slice(0, 2).map((t, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">#{t}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </DragOverlay>
  );
}