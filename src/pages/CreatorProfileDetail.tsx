import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { ArrowLeft, Edit, Target, User, Video, Mic, MicOff, Calendar, ExternalLink } from 'lucide-react';

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

interface ContentSample {
  id: string;
  source_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  platform: string;
  created_at: string;
  transcript?: string;
  status: string;
}

export const CreatorProfileDetail = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [contentSamples, setContentSamples] = useState<ContentSample[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && profileId) {
      fetchProfileData();
    }
  }, [user, profileId]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('id', profileId)
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch content samples
      const { data: samplesData, error: samplesError } = await supabase
        .from('user_content_samples')
        .select(`
          *,
          content_items (
            source_url,
            thumbnail_url,
            caption,
            platform,
            created_at,
            status
          ),
          content_analysis (
            transcript
          )
        `)
        .eq('profile_id', profileId)
        .eq('user_id', user?.id);

      if (samplesError) throw samplesError;
      
      // Transform the data
      const transformedSamples = samplesData?.map(sample => ({
        id: sample.content_item_id,
        source_url: sample.content_items?.source_url || '',
        thumbnail_url: sample.content_items?.thumbnail_url,
        caption: sample.content_items?.caption,
        platform: sample.content_items?.platform || 'instagram',
        created_at: sample.content_items?.created_at || sample.created_at,
        transcript: sample.content_analysis?.transcript,
        status: sample.content_items?.status || 'completed'
      })) || [];

      setContentSamples(transformedSamples);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
      navigate('/creator-profiles');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <p className="text-muted-foreground mb-6">The creator profile you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate('/creator-profiles')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profiles
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/creator-profiles')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(profile.brand_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile.brand_name}</h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                {profile.niche}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/creator-profiles/${profile.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Target Audience</h4>
              <p className="text-muted-foreground">{profile.target_audience}</p>
            </div>

            {profile.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{profile.description}</p>
              </div>
            )}

            <Separator />

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Content Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {profile.on_camera ? (
                      <Mic className="h-4 w-4 text-primary" />
                    ) : (
                      <MicOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">
                      {profile.on_camera ? 'Speaks on camera' : 'Uses AI voiceover'}
                    </span>
                  </div>
                  {profile.content_format && (
                    <div>
                      <span className="text-sm text-muted-foreground">Format: </span>
                      <span className="text-sm capitalize">{profile.content_format}</span>
                    </div>
                  )}
                  {profile.instagram_handle && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      <a 
                        href={`https://instagram.com/${profile.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        @{profile.instagram_handle}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Metadata</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Created {formatDate(profile.created_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-3 w-3" />
                    {profile.sample_count || 0} video samples
                  </div>
                  <Badge variant={profile.profile_status === 'complete' ? 'default' : 'secondary'}>
                    {profile.profile_status === 'complete' ? 'Complete' : 'In Setup'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {profile.personality_traits && profile.personality_traits.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Personality Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.personality_traits.map((trait) => (
                    <Badge key={trait} variant="secondary">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.content_goals && profile.content_goals.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Content Goals</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.content_goals.map((goal) => (
                    <Badge key={goal} variant="outline">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Samples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Samples
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contentSamples.length === 0 ? (
              <div className="text-center py-8">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No video samples yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contentSamples.map((sample) => (
                  <div key={sample.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {sample.platform}
                      </Badge>
                      <Badge variant={sample.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {sample.status}
                      </Badge>
                    </div>
                    
                    {sample.thumbnail_url && (
                      <img 
                        src={sample.thumbnail_url} 
                        alt="Video thumbnail"
                        className="w-full h-24 object-cover rounded"
                      />
                    )}
                    
                    {sample.caption && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {sample.caption}
                      </p>
                    )}
                    
                    {sample.transcript && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-primary">
                          View transcript
                        </summary>
                        <p className="mt-2 text-muted-foreground">
                          {sample.transcript.slice(0, 200)}...
                        </p>
                      </details>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {formatDate(sample.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};