import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/PageContainer';
import { CreditGuard } from '@/components/credits/CreditGuard';
import { CostPreview } from '@/components/credits/CostPreview';
import { CreatorSearchCard } from '@/components/CreatorSearchCard';
import { ResponsiveSearch } from '@/components/ui/responsive-search';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

interface CreatorSearch {
  id: string;
  query: string;
  status: string;
  requested_at: string;
  total_results: number;
  processing_time_seconds: number;
  completed_at?: string;
  error_message?: string;
}

export default function TikTokCreators() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searches, setSearches] = useState<CreatorSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const normalizeQuery = (str: string) => {
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  useEffect(() => {
    if (user) {
      loadSearchHistory();
    }
  }, [user]);

  const loadSearchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('search_queue')
        .select('*')
        .eq('user_id', user?.id)
        .eq('platform', 'tiktok')
        .eq('search_type', 'creators')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const formattedSearches = data?.map(item => ({
        id: item.id,
        query: item.username || '', // Store query in username field for creator searches
        status: item.status,
        requested_at: item.requested_at,
        total_results: item.total_results || 0,
        processing_time_seconds: item.processing_time_seconds || 0,
        completed_at: item.completed_at,
        error_message: item.error_message
      })) || [];

      setSearches(formattedSearches);
    } catch (error) {
      console.error('Error loading search history:', error);
      toast.error('Failed to load search history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    const normalized = normalizeQuery(query);
    
    // Check for duplicate query within 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const existingSearch = searches.find(
      search => search.query === normalized && search.requested_at > tenMinutesAgo
    );

    if (existingSearch) {
      toast.info('Search already in progress or recently completed');
      return;
    }

    setIsSearching(true);

    try {
      // Create search record
      const { data: searchRecord, error: insertError } = await supabase
        .from('search_queue')
        .insert({
          user_id: user?.id,
          platform: 'tiktok',
          search_type: 'creators',
          username: normalized, // Store query in username field
          status: 'queued'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to local state optimistically
      const newSearch: CreatorSearch = {
        id: searchRecord.id,
        query: normalized,
        status: 'queued',
        requested_at: searchRecord.requested_at,
        total_results: 0,
        processing_time_seconds: 0
      };

      setSearches(prev => [newSearch, ...prev]);

      // Start backend job
      const { data, error } = await supabase.functions.invoke('search-tiktok-creators', {
        body: { query: normalized, searchId: searchRecord.id }
      });

      if (error) {
        throw error;
      }

      // Update search status if immediate response
      if (data?.source === 'cache') {
        toast.success(`Found ${data.creators?.length || 0} creators (cached)`, {
          description: 'Results served from cache, no credits charged'
        });
        
        // Update local search record
        setSearches(prev => prev.map(search => 
          search.id === searchRecord.id 
            ? { ...search, status: 'completed', total_results: data.creators?.length || 0 }
            : search
        ));
      } else {
        toast.success('Creator search started', {
          description: '1 credit has been deducted from your account'
        });
        
        // Update search status to running
        setSearches(prev => prev.map(search => 
          search.id === searchRecord.id 
            ? { ...search, status: 'running' }
            : search
        ));
      }

      setQuery('');
    } catch (error) {
      console.error('Error starting creator search:', error);
      toast.error('Failed to start creator search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewResults = (searchId: string, query: string) => {
    navigate(`/tiktok-creators/${searchId}`);
  };

  const handleDeleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('search_queue')
        .delete()
        .eq('id', searchId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSearches(prev => prev.filter(search => search.id !== searchId));
      toast.success('Search deleted');
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
    }
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TikTok Creators</h1>
            <p className="text-muted-foreground mt-2">
              Find top TikTok creators for any niche.
            </p>
          </div>
          <CostPreview cost={1} description="per search" />
        </div>

        {/* Search Form */}
        <div className="space-y-6">
          <CreditGuard requiredCredits={1} action="search for creators">
            <ResponsiveSearch
              placeholder="Enter niche (e.g., make money online, fitness hacks)"
              value={query}
              onChange={setQuery}
              onSubmit={handleSearch}
              disabled={isSearching}
              loading={isSearching}
              buttonText="Search Creators"
              buttonIcon={<Search className="w-4 h-4" />}
              buttonClassName="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            />
          </CreditGuard>
        </div>

        {/* My Creator Searches */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-xl font-semibold">My Creator Searches</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : searches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No creator searches yet.</p>
              <p className="text-sm">Search for a niche to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searches.map((search) => (
                <CreatorSearchCard
                  key={search.id}
                  search={search}
                  onViewResults={() => handleViewResults(search.id, search.query)}
                  onDelete={() => handleDeleteSearch(search.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}