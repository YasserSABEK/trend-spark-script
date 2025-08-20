import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Target, 
  Palette, 
  Edit, 
  Brain, 
  Upload,
  Camera,
  CameraOff,
  Instagram,
  RefreshCw
} from 'lucide-react';

interface CreatorProfile {
  id: string;
  brand_name: string;
  niche: string;
  target_audience: string;
  content_goals: string[];
  on_camera: boolean;
  content_format: string;
  personality_traits: string[];
  instagram_handle: string;
  profile_status: string;
  sample_count: number;
  created_at: string;
  updated_at: string;
}

interface StyleProfile {
  id: string;
  sample_count: number;
  confidence_score: number;
  summary_text: string;
  last_updated: string;
}

interface CreatorProfileCardProps {
  onEdit: () => void;
}

const CreatorProfileCard: React.FC<CreatorProfileCardProps> = ({ onEdit }) => {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuildingStyle, setIsBuildingStyle] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      // Load creator profile
      const { data: profileData, error: profileError } = await supabase.functions.invoke('creator-profile', {
        body: { action: 'get' }
      });
      
      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      if (profileData?.profile) {
        setProfile(profileData.profile);
        
        // Load style profile if it exists
        const { data: styleData, error: styleError } = await supabase
          .from('user_style_profiles')
          .select('*')
          .eq('profile_id', profileData.profile.id)
          .maybeSingle();

        if (!styleError && styleData) {
          setStyleProfile(styleData);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load creator profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildStyleProfile = async () => {
    if (!profile) return;
    
    setIsBuildingStyle(true);
    try {
      const { data, error } = await supabase.functions.invoke('build-style-profile', {
        body: { profile_id: profile.id }
      });

      if (error) {
        if (error.message?.includes('INSUFFICIENT_CREDITS')) {
          toast({
            title: "Insufficient Credits",
            description: "You need 2 credits to build a style profile",
            variant: "destructive",
          });
        } else if (error.message?.includes('3 content samples')) {
          toast({
            title: "More Samples Needed",
            description: "You need at least 3 analyzed content samples to build a style profile. Analyze some of your content first!",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to build style profile",
            variant: "destructive",
          });
        }
        return;
      }

      setStyleProfile(data.style_profile);
      toast({
        title: "Success!",
        description: "Your style profile has been created successfully.",
      });
      
      // Reload profile to update sample count
      loadProfile();
    } catch (error) {
      console.error('Error building style profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsBuildingStyle(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-muted rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  const getContentFormatDisplay = (format: string) => {
    const formats: { [key: string]: string } = {
      educational: 'Educational',
      entertainment: 'Entertainment',
      motivational: 'Motivational',
      mixed: 'Mixed Style'
    };
    return formats[format] || format;
  };

  const styleProfileProgress = styleProfile ? 100 : (profile.sample_count >= 3 ? 75 : (profile.sample_count * 25));

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">{profile.brand_name}</CardTitle>
                <CardDescription className="flex items-center space-x-2">
                  <Badge variant="secondary">{profile.niche}</Badge>
                  {profile.on_camera ? (
                    <Camera className="h-4 w-4 text-success" />
                  ) : (
                    <CameraOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Content Format & Traits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Palette className="h-4 w-4 mr-2" />
                Content Style
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                {getContentFormatDisplay(profile.content_format)}
              </p>
              <div className="flex flex-wrap gap-1">
                {profile.personality_traits.map((trait) => (
                  <Badge key={trait} variant="outline" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Target Audience
              </h4>
              <p className="text-sm text-muted-foreground">
                {profile.target_audience}
              </p>
            </div>
          </div>

          {/* Content Goals */}
          {profile.content_goals && profile.content_goals.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Content Goals</h4>
              <div className="flex flex-wrap gap-1">
                {profile.content_goals.map((goal) => (
                  <Badge key={goal} variant="secondary" className="text-xs">
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Instagram Handle */}
          {profile.instagram_handle && (
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </h4>
              <p className="text-sm text-muted-foreground">
                {profile.instagram_handle}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Style Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI Style Profile
              </CardTitle>
              <CardDescription>
                Personalized content generation based on your unique style
              </CardDescription>
            </div>
            {!styleProfile && profile.sample_count >= 3 && (
              <Button 
                onClick={handleBuildStyleProfile}
                disabled={isBuildingStyle}
                size="sm"
              >
                {isBuildingStyle ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Building...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Build Style Profile (2 credits)
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Progress Indicator */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Style Profile Progress</span>
                <span>{profile.sample_count}/3 samples</span>
              </div>
              <Progress value={styleProfileProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {profile.sample_count < 3 
                  ? `Add ${3 - profile.sample_count} more analyzed content samples to build your style profile`
                  : styleProfile
                  ? `Style profile ready with ${styleProfile.confidence_score ? Math.round(styleProfile.confidence_score * 100) : 0}% confidence`
                  : 'Ready to build your personalized style profile!'
                }
              </p>
            </div>

            {/* Style Profile Summary */}
            {styleProfile ? (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Your Style Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {styleProfile.summary_text}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Last updated: {new Date(styleProfile.last_updated).toLocaleDateString()}
                  </span>
                  <Badge variant="outline">
                    {styleProfile.sample_count} samples analyzed
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Analyze Your Content</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use our "Analyze Content" feature to add your existing videos as style samples
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/analyze'}>
                  Analyze Content
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorProfileCard;