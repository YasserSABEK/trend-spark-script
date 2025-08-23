import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Clock, Video, Type, Mic } from 'lucide-react';
import { ShotBreakdown } from '@/types/viral-script';
import { useToast } from '@/hooks/use-toast';

interface ShotTimelineProps {
  shots: ShotBreakdown[];
}

export const ShotTimeline: React.FC<ShotTimelineProps> = ({ shots }) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const getShotTypeColor = (type?: string) => {
    switch (type) {
      case 'hook': return 'bg-primary/10 text-primary border-primary/20';
      case 'main_point': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'transition': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'cta': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getShotTypeLabel = (type?: string) => {
    switch (type) {
      case 'hook': return 'Hook';
      case 'main_point': return 'Main Point';
      case 'transition': return 'Transition';
      case 'cta': return 'Call to Action';
      default: return 'Scene';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Video className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Shot-by-Shot Timeline</h3>
        <Badge variant="outline" className="ml-auto">
          {shots.length} shots
        </Badge>
      </div>
      
      <div className="space-y-3">
        {shots.map((shot, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-sm font-medium text-primary">
                    {shot.shotNumber}
                  </div>
                  {index < shots.length - 1 && (
                    <div className="w-0.5 h-12 bg-border mt-2" />
                  )}
                </div>

                {/* Shot content */}
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{shot.timing}</span>
                      {shot.shotType && (
                        <Badge className={getShotTypeColor(shot.shotType)}>
                          {getShotTypeLabel(shot.shotType)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Visual description */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Visual</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(shot.visual, 'Visual direction')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-foreground">{shot.visual}</p>
                  </div>

                  {/* On-screen text */}
                  {shot.onScreenText && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">On-Screen Text</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(shot.onScreenText, 'On-screen text')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-yellow-800 font-medium">{shot.onScreenText}</p>
                    </div>
                  )}

                  {/* Voiceover */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Voiceover</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(shot.voiceover, 'Voiceover script')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-blue-800">{shot.voiceover}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};