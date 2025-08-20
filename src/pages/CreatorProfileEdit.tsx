import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import CreatorProfileWizard from '@/components/creator/CreatorProfileWizard';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreatorProfile {
  id: string;
  brand_name: string;
  niche: string;
  target_audience: string;
  content_format: string | null;
  personality_traits: string[] | null;
  content_goals: string[] | null;
  on_camera: boolean | null;
  instagram_handle: string | null;
  avatar_url: string | null;
  description: string | null;
  sample_count: number | null;
  profile_status: string | null;
  created_at: string;
  updated_at: string;
}

const CreatorProfileEdit: React.FC = () => {
  const { profileId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profileId && !authLoading) {
      fetchProfile();
    }
  }, [user, profileId, authLoading]);

  const fetchProfile = async () => {
    if (!profileId || !user?.id) {
      setError('Profile ID or user not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('id', profileId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Profile not found or you don\'t have permission to edit it');
        } else {
          setError(error.message);
        }
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdated = () => {
    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
    navigate(`/creator-profiles/${profileId}`);
  };

  const handleCancel = () => {
    navigate(`/creator-profiles/${profileId}`);
  };

  if (authLoading || isLoading) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/creator-profiles')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Edit Profile</h1>
                <p className="text-muted-foreground">Error loading profile</p>
              </div>
            </div>
            <div className="p-6 border border-destructive/20 rounded-lg bg-destructive/5">
              <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/creator-profiles')}>
                  Back to Profiles
                </Button>
                <Button onClick={fetchProfile}>
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The profile you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <Button onClick={() => navigate('/creator-profiles')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profiles
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <p className="text-muted-foreground">Update your creator profile settings</p>
            </div>
          </div>
          
          <CreatorProfileWizard 
            onComplete={handleProfileUpdated}
            existingProfile={profile}
            isEditing={true}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default CreatorProfileEdit;