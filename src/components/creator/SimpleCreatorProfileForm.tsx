import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Loader2, Plus, X, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/components/auth/AuthContext';
import { Switch } from '@/components/ui/switch';

interface SimpleCreatorProfileFormProps {
  onComplete: () => void;
  existingProfile?: any;
  isEditing?: boolean;
  onCreationStarted?: () => void;
}

interface VideoItem {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const SimpleCreatorProfileForm: React.FC<SimpleCreatorProfileFormProps> = ({ 
  onComplete, 
  existingProfile, 
  isEditing = false,
  onCreationStarted 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [enableVideoAnalysis, setEnableVideoAnalysis] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isProcessingVideos, setIsProcessingVideos] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form data state - declared early to avoid dependency issues
  const [formData, setFormData] = useState({
    brand_name: existingProfile?.brand_name || '',
    niche: existingProfile?.niche || '',
    target_audience: existingProfile?.target_audience || '',
    content_goals: existingProfile?.content_goals || [] as string[],
    on_camera: existingProfile?.on_camera || false,
    content_format: existingProfile?.content_format || '',
    personality_traits: existingProfile?.personality_traits || [] as string[],
    instagram_handle: existingProfile?.instagram_handle || ''
  });

  // localStorage keys
  const STORAGE_KEYS = {
    formData: 'creator-profile-form-data',
    videos: 'creator-profile-videos',
    enableVideoAnalysis: 'creator-profile-enable-video-analysis',
    currentUrl: 'creator-profile-current-url'
  };

  // Save form and video state to localStorage
  const saveFormState = useCallback(() => {
    if (!isEditing) { // Only persist for new profiles, not when editing
      try {
        localStorage.setItem(STORAGE_KEYS.formData, JSON.stringify(formData));
        localStorage.setItem(STORAGE_KEYS.videos, JSON.stringify(videos));
        localStorage.setItem(STORAGE_KEYS.enableVideoAnalysis, JSON.stringify(enableVideoAnalysis));
        localStorage.setItem(STORAGE_KEYS.currentUrl, currentUrl);
      } catch (error) {
        console.error('Error saving form state to localStorage:', error);
      }
    }
  }, [formData, videos, enableVideoAnalysis, currentUrl, isEditing, STORAGE_KEYS]);

  // Clear all form state from localStorage
  const clearFormState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.formData);
    localStorage.removeItem(STORAGE_KEYS.videos);
    localStorage.removeItem(STORAGE_KEYS.enableVideoAnalysis);
    localStorage.removeItem(STORAGE_KEYS.currentUrl);
  }, [STORAGE_KEYS]);

  // Restore form state from localStorage on component mount
  useEffect(() => {
    if (!isEditing) { // Only restore for new profiles, not when editing
      try {
        const savedFormData = localStorage.getItem(STORAGE_KEYS.formData);
        const savedVideos = localStorage.getItem(STORAGE_KEYS.videos);
        const savedEnableVideoAnalysis = localStorage.getItem(STORAGE_KEYS.enableVideoAnalysis);
        const savedCurrentUrl = localStorage.getItem(STORAGE_KEYS.currentUrl);

        if (savedFormData) {
          const parsedFormData = JSON.parse(savedFormData);
          if (parsedFormData && typeof parsedFormData === 'object') {
            setFormData(parsedFormData);
          }
        }

        if (savedVideos) {
          const parsedVideos = JSON.parse(savedVideos);
          if (Array.isArray(parsedVideos)) {
            setVideos(parsedVideos);
          }
        }

        if (savedEnableVideoAnalysis) {
          const parsedEnableVideoAnalysis = JSON.parse(savedEnableVideoAnalysis);
          if (typeof parsedEnableVideoAnalysis === 'boolean') {
            setEnableVideoAnalysis(parsedEnableVideoAnalysis);
          }
        }

        if (savedCurrentUrl && typeof savedCurrentUrl === 'string') {
          setCurrentUrl(savedCurrentUrl);
        }
      } catch (error) {
        console.error('Error restoring form state from localStorage:', error);
        // Clear corrupted data
        clearFormState();
      }
    }
  }, [isEditing, STORAGE_KEYS, clearFormState]);

  // Save form state whenever it changes (debounced via useCallback dependencies)
  useEffect(() => {
    const timeoutId = setTimeout(saveFormState, 500); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [saveFormState]);

  const niches = [
    'Fitness & Health', 'Business & Entrepreneurship', 'Technology', 'Lifestyle', 
    'Education', 'Entertainment', 'Fashion & Beauty', 'Travel', 'Food & Cooking', 
    'Personal Development', 'Finance', 'Gaming', 'Art & Design', 'Music', 'Other'
  ];

  const contentFormats = [
    { value: 'educational', label: 'Educational' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'motivational', label: 'Motivational' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'business', label: 'Business' }
  ];

  const personalityTraits = [
    'Energetic', 'Calm', 'Funny', 'Serious', 'Authentic', 'Professional', 
    'Creative', 'Analytical', 'Inspirational', 'Relatable', 'Expert', 'Friendly'
  ];

  const contentGoals = [
    'Build brand awareness', 'Generate leads', 'Educate audience', 'Drive sales',
    'Build community', 'Establish authority', 'Entertain followers', 'Share knowledge'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTraitToggle = (trait: string) => {
    const newTraits = formData.personality_traits.includes(trait)
      ? formData.personality_traits.filter(t => t !== trait)
      : [...formData.personality_traits, trait];
    
    handleInputChange('personality_traits', newTraits);
  };

  const handleGoalToggle = (goal: string) => {
    const newGoals = formData.content_goals.includes(goal)
      ? formData.content_goals.filter(g => g !== goal)
      : [...formData.content_goals, goal];
    
    handleInputChange('content_goals', newGoals);
  };

  // Video handling functions
  const validateInstagramUrl = (url: string): boolean => {
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+\/?/;
    return instagramRegex.test(url);
  };

  const addVideo = () => {
    if (!currentUrl.trim()) return;

    if (!validateInstagramUrl(currentUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Instagram reel or post URL",
        variant: "destructive",
      });
      return;
    }

    const isDuplicate = videos.some(video => video.url === currentUrl);
    if (isDuplicate) {
      toast({
        title: "Duplicate URL",
        description: "This video has already been added",
        variant: "destructive",
      });
      return;
    }

    if (videos.length >= 10) {
      toast({
        title: "Maximum videos reached",
        description: "You can add up to 10 videos for analysis",
        variant: "destructive",
      });
      return;
    }

    const newVideo: VideoItem = {
      id: Date.now().toString(),
      url: currentUrl,
      status: 'pending'
    };

    setVideos(prev => [...prev, newVideo]);
    setCurrentUrl('');
  };

  const removeVideo = (id: string) => {
    setVideos(prev => prev.filter(video => video.id !== id));
  };

  const getVideoStatusIcon = (status: VideoItem['status']) => {
    switch (status) {
      case 'pending':
        return <Play className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const isFormValid = () => {
    return formData.brand_name.trim() && 
           formData.niche && 
           formData.target_audience.trim() && 
           formData.content_format && 
           formData.personality_traits.length > 0;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Notify parent that creation has started
    if (!isEditing && onCreationStarted) {
      onCreationStarted();
    }
    
    try {
      let profileId = existingProfile?.id;

      if (isEditing) {
        // Update existing profile
        const { error } = await supabase
          .from('creator_profiles')
          .update({
            ...formData,
            profile_status: 'complete'
          })
          .eq('id', existingProfile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { data, error } = await supabase.functions.invoke('creator-profile', {
          body: {
            action: 'create',
            ...formData,
            profile_status: enableVideoAnalysis ? 'setup' : 'complete'
          }
        });

        if (error) throw error;
        profileId = data.profile.id;
      }

      // Process videos if enabled and added
      if (enableVideoAnalysis && videos.length > 0 && profileId) {
        setIsProcessingVideos(true);
        
        const videoUrls = videos.map(video => video.url);
        setVideos(prev => prev.map(video => ({ ...video, status: 'processing' as const })));

        const { data: videoData, error: videoError } = await supabase.functions.invoke('process-profile-videos', {
          body: {
            videoUrls,
            profileId
          }
        });

        if (videoError) {
          console.error('Video processing error:', videoError);
          toast({
            title: "Video Processing Failed",
            description: "Profile created but video analysis failed. You can add videos later.",
            variant: "destructive",
          });
        } else if (videoData.success) {
          toast({
            title: "Success!",
            description: `Profile created and ${videoData.processedVideos.length} videos are being analyzed.`,
          });
        }
      }

      toast({
        title: "Success!",
        description: isEditing ? "Profile updated successfully!" : "Creator profile created successfully!",
      });

      // Clear localStorage on successful profile creation
      if (!isEditing) {
        clearFormState();
      }

      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsProcessingVideos(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{isEditing ? 'Edit' : 'Create'} Your Creator Profile</h1>
        <p className="text-muted-foreground">
          Set up your profile to get personalized content recommendations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Tell us about your brand and content focus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand_name">Brand/Creator Name *</Label>
              <Input
                id="brand_name"
                value={formData.brand_name}
                onChange={(e) => handleInputChange('brand_name', e.target.value)}
                placeholder="Your brand or personal name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="niche">Content Niche *</Label>
              <Select 
                value={formData.niche}
                onValueChange={(value) => handleInputChange('niche', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your content niche" />
                </SelectTrigger>
                <SelectContent>
                  {niches.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Target Audience *</Label>
            <Textarea
              id="target_audience"
              value={formData.target_audience}
              onChange={(e) => handleInputChange('target_audience', e.target.value)}
              placeholder="Describe your ideal audience (e.g., young professionals, fitness enthusiasts, small business owners)"
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram_handle">Instagram Handle (Optional)</Label>
            <Input
              id="instagram_handle"
              value={formData.instagram_handle}
              onChange={(e) => handleInputChange('instagram_handle', e.target.value)}
              placeholder="@yourusername"
            />
          </div>

          <div className="space-y-3">
            <Label>Content Goals</Label>
            <div className="grid grid-cols-2 gap-2">
              {contentGoals.map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={formData.content_goals.includes(goal)}
                    onCheckedChange={() => handleGoalToggle(goal)}
                  />
                  <Label htmlFor={goal} className="text-sm">
                    {goal}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Style</CardTitle>
          <CardDescription>Define your content approach and personality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">On-Camera Presence *</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={formData.on_camera ? "default" : "outline"}
                className="h-20 flex-col space-y-2"
                onClick={() => handleInputChange('on_camera', true)}
              >
                <Mic className="h-6 w-6" />
                <span>Yes, I speak on camera</span>
              </Button>
              <Button
                type="button"
                variant={!formData.on_camera ? "default" : "outline"}
                className="h-20 flex-col space-y-2"
                onClick={() => handleInputChange('on_camera', false)}
              >
                <MicOff className="h-6 w-6" />
                <span>I use AI voiceover</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Content Format *</Label>
            <RadioGroup
              value={formData.content_format}
              onValueChange={(value) => handleInputChange('content_format', value)}
              className="space-y-3"
            >
              {contentFormats.map((format) => (
                <div key={format.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={format.value} id={format.value} />
                  <Label htmlFor={format.value} className="text-sm font-medium cursor-pointer">
                    {format.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Personality Traits * (Select 3-5 that best describe you)</Label>
            <div className="grid grid-cols-3 gap-2">
              {personalityTraits.map((trait) => (
                <Badge
                  key={trait}
                  variant={formData.personality_traits.includes(trait) ? "default" : "outline"}
                  className="cursor-pointer justify-center py-2 hover:bg-primary/90 transition-colors"
                  onClick={() => handleTraitToggle(trait)}
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Content Analysis (Optional)
            <Switch
              checked={enableVideoAnalysis}
              onCheckedChange={setEnableVideoAnalysis}
            />
          </CardTitle>
          <CardDescription>
            Add your existing Instagram content to analyze your style and improve recommendations
          </CardDescription>
        </CardHeader>
        {enableVideoAnalysis && (
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addVideo()}
                disabled={isProcessingVideos}
              />
              <Button 
                onClick={addVideo} 
                variant="outline" 
                size="icon"
                disabled={isProcessingVideos}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {videos.length > 0 && (
              <div className="space-y-2">
                {videos.map((video, index) => (
                  <div key={video.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getVideoStatusIcon(video.status)}
                      <span className="text-sm">Video {index + 1}</span>
                      <Badge variant={video.status === 'completed' ? 'default' : video.status === 'error' ? 'destructive' : 'secondary'}>
                        {video.status}
                      </Badge>
                    </div>
                    {!isProcessingVideos && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVideo(video.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isProcessingVideos && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing videos...</span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} />
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid() || isLoading || isProcessingVideos}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Profile' : 'Create Profile'
          )}
        </Button>
      </div>
    </div>
  );
};

export default SimpleCreatorProfileForm;