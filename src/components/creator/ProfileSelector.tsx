import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { Plus, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreatorProfile {
  id: string;
  brand_name: string;
  niche: string;
  target_audience: string;
  content_format: string | null;
  personality_traits: string[] | null;
  on_camera: boolean | null;
  avatar_url: string | null;
  profile_status: string | null;
}

interface ProfileSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  onProfileSelect?: (profile: CreatorProfile | null) => void;
  className?: string;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  value,
  onValueChange,
  onProfileSelect,
  className
}) => {
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('profile_status', 'complete')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleValueChange = (profileId: string) => {
    onValueChange(profileId);
    const selectedProfile = profiles.find(p => p.id === profileId);
    onProfileSelect?.(selectedProfile || null);
  };

  const selectedProfile = profiles.find(p => p.id === value);

  if (isLoading) {
    return (
      <div className={className}>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading profiles..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="No creator profiles found" />
          </SelectTrigger>
        </Select>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/creator-profiles/new')}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Profile
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="h-auto min-h-[3rem] bg-card border-2 hover:border-primary/20 transition-colors">
          <SelectValue placeholder="Select a creator profile">
            {selectedProfile && (
              <div className="flex items-center gap-3 py-2">
                <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                  <AvatarImage src={selectedProfile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10 text-primary font-semibold text-sm">
                    {getInitials(selectedProfile.brand_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{selectedProfile.brand_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs font-medium bg-secondary/10 text-secondary-foreground">
                      {selectedProfile.niche}
                    </Badge>
                    {selectedProfile.on_camera !== null && (
                      <Badge variant="outline" className="text-xs bg-background">
                        {selectedProfile.on_camera ? 'On-camera' : 'Voiceover'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-2 shadow-lg">
          {profiles.map((profile) => (
            <SelectItem 
              key={profile.id} 
              value={profile.id}
              className="hover:bg-accent/50 focus:bg-accent/50 cursor-pointer p-3"
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10 text-primary font-semibold">
                    {getInitials(profile.brand_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{profile.brand_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Target className="h-3 w-3" />
                    {profile.niche}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {profile.target_audience}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {profile.content_format && (
                    <Badge variant="secondary" className="text-xs font-medium bg-secondary/10 text-secondary-foreground">
                      {profile.content_format}
                    </Badge>
                  )}
                  {profile.on_camera !== null && (
                    <Badge variant="outline" className="text-xs bg-background">
                      {profile.on_camera ? 'On-camera' : 'Voiceover'}
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate('/creator-profiles/new')}
        className="w-full border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New Profile
      </Button>
    </div>
  );
};