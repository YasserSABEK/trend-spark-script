import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import SimpleCreatorProfileForm from '@/components/creator/SimpleCreatorProfileForm';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const CreatorProfile: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Debug logging
  console.log('CreatorProfile component rendered:', { user: !!user, loading, hasProfile, isLoading });

  useEffect(() => {
    console.log('CreatorProfile useEffect triggered:', { user: !!user, loading, hasCheckedProfile, isCreating });
    // Only check for profile on initial load, not on subsequent auth state changes
    if (user && !loading && !hasCheckedProfile && !isCreating) {
      checkForProfile();
    } else if (!loading && !user) {
      console.log('No user found, stopping loading');
      setIsLoading(false);
    }
  }, [user, loading, hasCheckedProfile, isCreating]);

  const checkForProfile = async () => {
    console.log('Checking for profile...');
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('creator-profile', {
        body: { action: 'get' }
      });
      console.log('Profile check result:', { data, error });
      
      if (error) {
        console.error('Error checking profile:', error);
        setError(`Profile check failed: ${error.message}`);
        setHasProfile(false);
        return;
      }

      setHasProfile(!!data?.profile);
      console.log('Profile exists:', !!data?.profile);
    } catch (error) {
      console.error('Error checking profile:', error);
      setError(`Profile check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setHasProfile(false);
    } finally {
      setIsLoading(false);
      setHasCheckedProfile(true);
    }
  };

  const handleProfileCreated = async () => {
    try {
      // Get the created profile to navigate to detail view
      const { data, error } = await supabase.functions.invoke('creator-profile', {
        body: { action: 'get' }
      });
      
      if (data?.profile) {
        navigate(`/creator-profiles/${data.profile.id}`);
      } else {
        setHasProfile(true);
      }
    } catch (error) {
      console.error('Error after profile creation:', error);
      setHasProfile(true);
    }
    setIsCreating(false);
  };

  const handleCreationStarted = () => {
    setIsCreating(true);
  };

  // Don't redirect immediately, wait for auth to complete
  if (loading) {
    console.log('Auth still loading...');
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    console.log('No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    console.log('Profile loading...');
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    console.log('Profile error:', error);
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="p-6 border border-destructive/20 rounded-lg bg-destructive/5">
              <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Profile</h2>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {!hasProfile ? (
          <SimpleCreatorProfileForm 
            onComplete={handleProfileCreated} 
            onCreationStarted={handleCreationStarted}
          />
        ) : (
          // Redirect to profiles list if already has profile
          <Navigate to="/creator-profiles" replace />
        )}
      </div>
    </PageContainer>
  );
};

export default CreatorProfile;