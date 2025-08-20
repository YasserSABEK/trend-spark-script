import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, ArrowRight, Check, User, Target, Palette, Video, Mic, MicOff, Loader2, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/components/auth/AuthContext';
import { useWizardPersistence } from '@/hooks/useWizardPersistence';
import VideoUploadStep from './VideoUploadStep';
import WizardResumeModal from './WizardResumeModal';

interface CreatorProfileWizardProps {
  onComplete: () => void;
  existingProfile?: any;
  isEditing?: boolean;
}

const CreatorProfileWizard: React.FC<CreatorProfileWizardProps> = ({ 
  onComplete, 
  existingProfile, 
  isEditing = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialState = {
    currentStep: 1,
    formData: {
      brand_name: existingProfile?.brand_name || '',
      niche: existingProfile?.niche || '',
      target_audience: existingProfile?.target_audience || '',
      content_goals: existingProfile?.content_goals || [] as string[],
      on_camera: existingProfile?.on_camera || false,
      content_format: existingProfile?.content_format || '',
      personality_traits: existingProfile?.personality_traits || [] as string[],
      instagram_handle: existingProfile?.instagram_handle || '',
      video_processing_complete: false
    },
    processingResults: null,
    createdProfileId: isEditing ? existingProfile?.id : null
  };

  const { state, saveState, clearState, hasUnsavedChanges, hasSavedState } = useWizardPersistence({
    userId: user?.id,
    storageKey: 'creator_profile_wizard',
    initialState
  });

  const [isProcessingVideos, setIsProcessingVideos] = useState(false);

  // Check for saved state on mount (only for new profiles)
  useEffect(() => {
    if (!isEditing && hasSavedState() && !existingProfile) {
      setShowResumeModal(true);
    }
  }, [isEditing, hasSavedState, existingProfile]);

  // Add beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && state.currentStep > 1) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, state.currentStep]);

  const steps = [
    { id: 1, title: 'Brand Identity', icon: User, description: 'Tell us about your brand' },
    { id: 2, title: 'Content Style', icon: Palette, description: 'Define your content approach' },
    { id: 3, title: 'Content Analysis', icon: Video, description: 'Add your existing content' },
    { id: 4, title: 'Review & Complete', icon: Check, description: 'Review and finalize your profile' }
  ];

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

  const handleNext = async () => {
    if (state.currentStep === 2 && !state.createdProfileId) {
      // Create profile after step 2 to get profile ID for video processing
      await createProfile();
    }
    
    if (state.currentStep < 4) {
      saveState({
        ...state,
        currentStep: state.currentStep + 1
      });
    }
  };

  const createProfile = async () => {
    try {
      if (isEditing) {
        // Update existing profile
        const { data, error } = await supabase
          .from('creator_profiles')
          .update({
            ...state.formData,
            profile_status: 'setup'
          })
          .eq('id', existingProfile.id)
          .select()
          .single();

        if (error) {
          toast({
            title: "Error",
            description: error.message || "Failed to update creator profile",
            variant: "destructive",
          });
          return null;
        }

        return existingProfile.id;
      } else {
        // Create new profile
        const { data, error } = await supabase.functions.invoke('creator-profile', {
          body: {
            action: 'create',
            ...state.formData,
            profile_status: 'setup' // Mark as setup in progress
          }
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message || "Failed to create creator profile",
            variant: "destructive",
          });
          return null;
        }

        saveState({
          ...state,
          createdProfileId: data.profile.id
        });
        return data.profile.id;
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  const handlePrevious = () => {
    if (state.currentStep > 1) {
      saveState({
        ...state,
        currentStep: state.currentStep - 1
      });
    }
  };

  const handleTraitToggle = (trait: string) => {
    const newTraits = state.formData.personality_traits.includes(trait)
      ? state.formData.personality_traits.filter(t => t !== trait)
      : [...state.formData.personality_traits, trait];
    
    saveState({
      ...state,
      formData: {
        ...state.formData,
        personality_traits: newTraits
      }
    });
  };

  const handleGoalToggle = (goal: string) => {
    const newGoals = state.formData.content_goals.includes(goal)
      ? state.formData.content_goals.filter(g => g !== goal)
      : [...state.formData.content_goals, goal];
    
    saveState({
      ...state,
      formData: {
        ...state.formData,
        content_goals: newGoals
      }
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Update profile to complete status
      if (state.createdProfileId) {
        const { error } = await supabase.functions.invoke('creator-profile', {
          body: {
            action: 'update',
            profile_status: 'complete',
            sample_count: state.processingResults?.completedVideos || 0
          }
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message || "Failed to complete creator profile",
            variant: "destructive",
          });
          return;
        }
      }

      // Clear saved state on successful completion
      clearState();

      toast({
        title: "Success!",
        description: "Your creator profile has been created successfully.",
      });

      onComplete();
    } catch (error) {
      console.error('Error completing profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeFromSaved = () => {
    setShowResumeModal(false);
    toast({
      title: "Resumed",
      description: "Continuing from where you left off",
    });
  };

  const handleStartFresh = () => {
    clearState();
    saveState(initialState);
    setShowResumeModal(false);
    toast({
      title: "Starting Fresh",
      description: "Previous progress has been cleared",
    });
  };

  const handleSaveDraft = async () => {
    if (!state.createdProfileId) {
      await createProfile();
    }
    
    toast({
      title: "Draft Saved",
      description: "Your progress has been saved",
    });
  };

  const handleVideoProcessingStart = () => {
    console.log('Video processing started');
    setIsProcessingVideos(true);
  };

  const handleVideoProcessingComplete = (results: any) => {
    console.log('Video processing completed:', results);
    setIsProcessingVideos(false);
    
    try {
      saveState({
        ...state,
        processingResults: results,
        formData: {
          ...state.formData,
          video_processing_complete: true
        }
      });
      
      toast({
        title: "Video Processing Complete",
        description: `Successfully processed ${results.completedVideos || 0} video(s)`,
      });
    } catch (error) {
      console.error('Error saving processing results:', error);
      toast({
        title: "Error Saving Progress",
        description: "Videos processed but failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVideoProcessingError = (error: any) => {
    console.error('Video processing error:', error);
    setIsProcessingVideos(false);
    
    toast({
      title: "Video Processing Failed",
      description: error?.message || "Failed to process videos. Please try again.",
      variant: "destructive",
    });
  };

  const isStepValid = () => {
    switch (state.currentStep) {
      case 1:
        return state.formData.brand_name && state.formData.niche && state.formData.target_audience;
      case 2:
        return state.formData.content_format && state.formData.personality_traits.length > 0;
      case 3:
        return !isProcessingVideos; // Can proceed when not processing
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="brand_name">Brand/Creator Name *</Label>
              <Input
                id="brand_name"
                value={state.formData.brand_name}
                onChange={(e) => saveState({
                  ...state,
                  formData: { ...state.formData, brand_name: e.target.value }
                })}
                placeholder="Your brand or personal name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="niche">Content Niche *</Label>
              <Select 
                value={state.formData.niche}
                onValueChange={(value) => saveState({
                  ...state,
                  formData: { ...state.formData, niche: value }
                })}
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

            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience *</Label>
              <Textarea
                id="target_audience"
                value={state.formData.target_audience}
                onChange={(e) => saveState({
                  ...state,
                  formData: { ...state.formData, target_audience: e.target.value }
                })}
                placeholder="Describe your ideal audience (e.g., young professionals, fitness enthusiasts, small business owners)"
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Content Goals</Label>
              <div className="grid grid-cols-2 gap-2">
                {contentGoals.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={state.formData.content_goals.includes(goal)}
                      onCheckedChange={() => handleGoalToggle(goal)}
                    />
                    <Label htmlFor={goal} className="text-sm">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">On-Camera Presence *</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={state.formData.on_camera ? "default" : "outline"}
                  className="h-20 flex-col space-y-2"
                  onClick={() => saveState({
                    ...state,
                    formData: { ...state.formData, on_camera: true }
                  })}
                >
                  <Mic className="h-6 w-6" />
                  <span>Yes, I speak on camera</span>
                </Button>
                <Button
                  type="button"
                  variant={!state.formData.on_camera ? "default" : "outline"}
                  className="h-20 flex-col space-y-2"
                  onClick={() => saveState({
                    ...state,
                    formData: { ...state.formData, on_camera: false }
                  })}
                >
                  <MicOff className="h-6 w-6" />
                  <span>I use AI voiceover</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Content Format *</Label>
              <RadioGroup
                value={state.formData.content_format}
                onValueChange={(value) => saveState({
                  ...state,
                  formData: { ...state.formData, content_format: value }
                })}
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
                    variant={state.formData.personality_traits.includes(trait) ? "default" : "outline"}
                    className="cursor-pointer justify-center py-2 hover:bg-primary/90 transition-colors"
                    onClick={() => handleTraitToggle(trait)}
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {state.formData.personality_traits.length}/5
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {state.createdProfileId ? (
              <VideoUploadStep
                profileId={state.createdProfileId}
                onProcessingStart={handleVideoProcessingStart}
                onProcessingComplete={handleVideoProcessingComplete}
                onProcessingError={handleVideoProcessingError}
              />
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Setting up your profile...</p>
              </div>
            )}

            {state.processingResults && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">✅ Processing Complete!</h4>
                <p className="text-sm text-muted-foreground">
                  Successfully transcribed {state.processingResults.completedVideos} video(s). 
                  {state.processingResults.errors > 0 && ` ${state.processingResults.errors} video(s) failed to process.`}
                </p>
              </div>
            )}

            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-medium mb-2 text-primary">💡 Why We Analyze Your Content</h4>
              <p className="text-sm text-muted-foreground">
                By analyzing your existing videos, we learn your unique style, tone, and content patterns. 
                This helps us generate scripts that sound authentically like you.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Review Your Creator Profile</h3>
              <p className="text-muted-foreground">
                Please review your information before completing setup
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Brand Name</Label>
                  <p className="font-medium">{state.formData.brand_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Niche</Label>
                  <p className="font-medium">{state.formData.niche}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Target Audience</Label>
                <p className="font-medium">{state.formData.target_audience}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Content Format</Label>
                <p className="font-medium capitalize">{state.formData.content_format}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Personality Traits</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {state.formData.personality_traits.map((trait) => (
                    <Badge key={trait} variant="secondary">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>

              {state.formData.content_goals.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Content Goals</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {state.formData.content_goals.map((goal) => (
                      <Badge key={goal} variant="outline">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {state.processingResults && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Content Analysis</Label>
                  <p className="font-medium">
                    {state.processingResults.completedVideos} video(s) analyzed successfully
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <WizardResumeModal
        isOpen={showResumeModal}
        onResume={handleResumeFromSaved}
        onStartFresh={handleStartFresh}
        currentStep={state.currentStep}
        totalSteps={4}
        brandName={state.formData.brand_name}
      />
      
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle>
                  {isEditing ? 'Edit Creator Profile' : 'Create Your Creator Profile'}
                </CardTitle>
                <CardDescription>
                  Step {state.currentStep} of {steps.length}: {steps[state.currentStep - 1].description}
                </CardDescription>
              </div>
              <div className="text-right">
                <Progress value={(state.currentStep / steps.length) * 100} className="w-32" />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-2 ${
                      step.id === state.currentStep
                        ? 'text-primary'
                        : step.id < state.currentStep
                        ? 'text-success'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`rounded-full p-2 ${
                        step.id === state.currentStep
                          ? 'bg-primary text-primary-foreground'
                          : step.id < state.currentStep
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </CardHeader>

          <CardContent>
            {renderStep()}

            <div className="flex justify-between pt-6 mt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={state.currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex gap-2">
                {!isEditing && state.currentStep > 1 && state.currentStep < 4 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSaveDraft}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Draft
                  </Button>
                )}
                
                {state.currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreatorProfileWizard;