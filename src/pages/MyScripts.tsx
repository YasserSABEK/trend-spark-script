import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { DroppableArea } from '@/components/dnd/DroppableArea';
import { 
  Search, 
  Star, 
  StarOff, 
  Copy, 
  Trash2, 
  Edit, 
  Calendar,
  Hash,
  TrendingUp,
  FileText,
  Filter,
  Sparkles
} from 'lucide-react';

interface Script {
  id: string;
  title: string;
  hook: string;
  main_content: string;
  call_to_action: string;
  suggested_hashtags: string[];
  niche: string | null;
  tone_of_voice: string | null;
  target_audience: string | null;
  performance_score: number;
  is_favorite: boolean;
  created_at: string;
}

export const MyScripts = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadScripts();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortScripts();
  }, [scripts, searchTerm, selectedNiche, sortBy]);

  const loadScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_scripts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error('Error loading scripts:', error);
      toast({
        title: "Error",
        description: "Failed to load your scripts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortScripts = () => {
    let filtered = scripts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(script =>
        script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.hook.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.main_content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by niche
    if (selectedNiche !== 'all') {
      filtered = filtered.filter(script => script.niche === selectedNiche);
    }

    // Sort scripts
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'performance':
        filtered.sort((a, b) => b.performance_score - a.performance_score);
        break;
      case 'favorites':
        filtered.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));
        break;
    }

    setFilteredScripts(filtered);
  };

  const toggleFavorite = async (scriptId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('generated_scripts')
        .update({ is_favorite: !currentStatus })
        .eq('id', scriptId);

      if (error) throw error;

      setScripts(scripts.map(script =>
        script.id === scriptId
          ? { ...script, is_favorite: !currentStatus }
          : script
      ));

      toast({
        title: currentStatus ? "Removed from Favorites" : "Added to Favorites",
        description: "Script updated successfully."
      });
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status.",
        variant: "destructive"
      });
    }
  };

  const deleteScript = async (scriptId: string) => {
    try {
      const { error } = await supabase
        .from('generated_scripts')
        .delete()
        .eq('id', scriptId);

      if (error) throw error;

      setScripts(scripts.filter(script => script.id !== scriptId));
      toast({
        title: "Script Deleted",
        description: "Script has been permanently deleted."
      });
    } catch (error) {
      console.error('Error deleting script:', error);
      toast({
        title: "Error",
        description: "Failed to delete script.",
        variant: "destructive"
      });
    }
  };

  const copyScript = (script: Script) => {
    const fullScript = `${script.hook}\n\n${script.main_content}\n\n${script.call_to_action}\n\n${script.suggested_hashtags?.map(tag => `#${tag}`).join(' ') || ''}`;
    navigator.clipboard.writeText(fullScript);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard."
    });
  };

  const uniqueNiches = [...new Set(scripts.map(script => script.niche).filter(Boolean))];

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">My Scripts</h1>
          <p className="text-muted-foreground">Manage your generated content scripts</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scripts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by niche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Niches</SelectItem>
                {uniqueNiches.map((niche) => (
                  <SelectItem key={niche} value={niche!}>{niche}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="performance">Performance Score</SelectItem>
                <SelectItem value="favorites">Favorites First</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>{filteredScripts.length} of {scripts.length} scripts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Drop Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Script from Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DroppableArea
            id="my-scripts-drop"
            placeholder="Drop a video to generate a new script"
            icon={<Sparkles className="w-8 h-8 mb-2" />}
            className="p-8"
          />
        </CardContent>
      </Card>

      {/* Scripts Grid */}
      {filteredScripts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Scripts Found</h3>
            <p className="text-muted-foreground mb-4">
              {scripts.length === 0 
                ? "You haven't generated any scripts yet."
                : "No scripts match your current filters."
              }
            </p>
            <Button onClick={() => window.location.href = '/script-generator'}>
              Generate Your First Script
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScripts.map((script) => (
            <Card key={script.id} className="relative group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{script.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(script.id, script.is_favorite)}
                    className="shrink-0"
                  >
                    {script.is_favorite ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(script.created_at).toLocaleDateString()}</span>
                  <TrendingUp className="h-3 w-3 ml-2" />
                  <span>{script.performance_score}/100</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-primary mb-1">Hook:</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{script.hook}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-primary mb-1">Content:</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{script.main_content}</p>
                </div>

                {script.niche && (
                  <Badge variant="secondary" className="text-xs">
                    {script.niche}
                  </Badge>
                )}

                {script.suggested_hashtags && script.suggested_hashtags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {script.suggested_hashtags.length} hashtags
                    </span>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyScript(script)}
                    className="flex-1"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteScript(script.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};