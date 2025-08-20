import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import CreatorProfileWizard from '@/components/creator/CreatorProfileWizard';
import CreatorProfileCard from '@/components/creator/CreatorProfileCard';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const CreatorProfile: React.FC = () => {
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (user) {
      checkForProfile();
    }
  }, [user]);

  const checkForProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('creator-profile');
      
      if (error) {
        console.error('Error checking profile:', error);
        setHasProfile(false);
        return;
      }

      setHasProfile(!!data?.profile);
    } catch (error) {
      console.error('Error checking profile:', error);
      setHasProfile(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileCreated = () => {
    setHasProfile(true);
    setShowWizard(false);
  };

  const handleEditProfile = () => {
    setShowWizard(true);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
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

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {!hasProfile || showWizard ? (
          <CreatorProfileWizard onComplete={handleProfileCreated} />
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