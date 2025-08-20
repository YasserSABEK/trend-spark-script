import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import SimpleCreatorProfileForm from '@/components/creator/SimpleCreatorProfileForm';
import CreatorProfileCard from '@/components/creator/CreatorProfileCard';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const CreatorProfile: React.FC = () => {
  const { user, loading } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
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

  const handleProfileCreated = () => {
    setHasProfile(true);
    setShowWizard(false);
    setIsCreating(false);
  };

  const handleEditProfile = () => {
    setShowWizard(true);
    setIsCreating(true);
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
        {!hasProfile || showWizard ? (
          <SimpleCreatorProfileForm 
            onComplete={handleProfileCreated} 
            onCreationStarted={handleCreationStarted}
          />
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Creator Profile</h1>
              <p className="text-muted-foreground">
                Manage your creator profile and personalization settings
              </p>
            </div>
            <CreatorProfileCard onEdit={handleEditProfile} />
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CreatorProfile;