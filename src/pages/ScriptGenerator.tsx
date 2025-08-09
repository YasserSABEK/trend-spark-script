import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Copy, Heart, Star } from 'lucide-react';
import { CreditGuard } from '@/components/credits/CreditGuard';
import { DroppableArea } from '@/components/dnd/DroppableArea';

interface GeneratedScript {
  hook: string;
  mainContent: string;
  callToAction: string;
  hashtags: string[];
}

export const ScriptGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [formData, setFormData] = useState({
    prompt: '',
    niche: '',
    toneOfVoice: '',
    targetAudience: '',
    hookStyle: ''
  });
  const { toast } = useToast();

  // Pre-fill form from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const prompt = urlParams.get('prompt');
    const caption = urlParams.get('caption');
    const platform = urlParams.get('platform');
    
    if (prompt) {
      setFormData(prev => ({ ...prev, prompt }));
    }
  }, []);

  const { isOver, setNodeRef } = useDroppable({
    id: 'script-generator-drop',
    data: {
      accepts: ['content-item'],
    },
  });

  const handleContentDrop = (droppedContent: any) => {
    const item = droppedContent.item;
    const autoPrompt = `Create a script inspired by this ${item.platform} post: "${item.caption || 'viral video'}"${item.tags ? ` with hashtags: ${item.tags.slice(0, 5).join(', ')}` : ''}`;
    
    setFormData(prev => ({
      ...prev,
      prompt: autoPrompt,
      niche: item.tags?.[0] ? item.tags[0].replace(/([A-Z])/g, ' $1').trim() : prev.niche
    }));
    
    toast({
      title: "Content Added!",
      description: "Video content has been analyzed and added to your prompt.",
    });
  };

  const niches = [
    'Fitness & Health', 'Food & Cooking', 'Travel & Adventure', 'Fashion & Beauty',
    'Business & Entrepreneurship', 'Technology', 'Education', 'Entertainment',
    'Lifestyle', 'DIY & Crafts', 'Motivation & Self-Help', 'Pets & Animals'
  ];

  const tones = [
    'Professional', 'Casual & Friendly', 'Energetic & Upbeat', 'Inspiring & Motivational',
    'Humorous & Fun', 'Educational & Informative', 'Trendy & Hip', 'Authentic & Personal'
  ];

  const audiences = [
    'Gen Z (18-24)', 'Millennials (25-40)', 'Gen X (41-56)', 'All Ages',
    'Beginners', 'Experts', 'Small Business Owners', 'Students',
    'Parents', 'Professionals', 'Creators', 'Entrepreneurs'
  ];

  const hookStyles = [
    'Question', 'Bold Statement', 'Number/Statistic', 'Controversial Opinion',
    'Personal Story', 'Common Mistake', 'Secret/Tip', 'Challenge'
  ];

  const handleGenerate = async () => {
    if (!formData.prompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a prompt for your script.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: formData
      });

      if (error) throw error;

      setGeneratedScript(data.generated);
      toast({
        title: "Script Generated!",
        description: "Your viral script has been created and saved.",
      });

    } catch (error) {
      console.error('Script generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate script. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  const copyFullScript = () => {
    if (!generatedScript) return;
    
    const fullScript = `
${generatedScript.hook}

${generatedScript.mainContent}

${generatedScript.callToAction}

${generatedScript.hashtags.map(tag => `#${tag}`).join(' ')}
    `.trim();
    
    copyToClipboard(fullScript);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Script Generator</h1>
          <p className="text-muted-foreground">Create viral content with AI-powered scripts</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Script Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prompt">What's your script about? *</Label>
              <div className="space-y-3">
                <Textarea
                  id="prompt"
                  placeholder="Describe what you want your script to be about... (e.g., 'morning routine for productivity', '5 fitness tips for beginners')"
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  className="min-h-[100px]"
                />
                <DroppableArea
                  id="script-generator-prompt-drop"
                  placeholder="Drop a video to auto-generate prompt"
                  className="p-4"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="niche">Niche</Label>
                <Select value={formData.niche} onValueChange={(value) => setFormData({ ...formData, niche: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your niche" />
                  </SelectTrigger>
                  <SelectContent>
                    {niches.map((niche) => (
                      <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tone">Tone of Voice</Label>
                <Select value={formData.toneOfVoice} onValueChange={(value) => setFormData({ ...formData, toneOfVoice: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((tone) => (
                      <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Select value={formData.targetAudience} onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {audiences.map((audience) => (
                      <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hook">Hook Style</Label>
                <Select value={formData.hookStyle} onValueChange={(value) => setFormData({ ...formData, hookStyle: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hook style" />
                  </SelectTrigger>
                  <SelectContent>
                    {hookStyles.map((style) => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <CreditGuard
              requiredCredits={1}
              action="generate a script"
            >
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !formData.prompt.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Script (1 Credit)
                  </>
                )}
              </Button>
            </CreditGuard>
          </CardContent>
        </Card>

        {/* Generated Script Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Script
              {generatedScript && (
                <Button variant="outline" size="sm" onClick={copyFullScript}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedScript ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-primary">Hook</Label>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedScript.hook)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    {generatedScript.hook}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-primary">Main Content</Label>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedScript.mainContent)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    {generatedScript.mainContent}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-primary">Call to Action</Label>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedScript.callToAction)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    {generatedScript.callToAction}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-semibold text-primary mb-2 block">Suggested Hashtags</Label>
                  <div className="flex flex-wrap gap-2">
                    {generatedScript.hashtags.map((hashtag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => copyToClipboard(`#${hashtag}`)}>
                        #{hashtag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your generated script will appear here</p>
                <p className="text-sm">Fill out the form and click "Generate Script" to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};