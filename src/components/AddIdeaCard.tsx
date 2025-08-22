import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { NewContentModal } from "./NewContentModal";
import { Plus, Sparkles } from "lucide-react";

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

interface AddIdeaCardProps {
  onContentCreated: (content: ContentItem) => void;
}

export function AddIdeaCard({ onContentCreated }: AddIdeaCardProps) {
  return (
    <NewContentModal onContentCreated={onContentCreated}>
      <Card className="group cursor-pointer border-2 border-dashed border-muted-foreground/25 hover:border-primary/40 transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-muted/10 hover:bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-3 min-h-[120px]">
          <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5 text-primary group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              Add New Idea
            </p>
            <p className="text-xs text-muted-foreground">
              Start planning your content
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary/80 transition-colors">
            <Sparkles className="w-3 h-3" />
            Click to create
          </div>
        </CardContent>
      </Card>
    </NewContentModal>
  );
}