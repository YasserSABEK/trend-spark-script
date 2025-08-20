import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Check, User, Target, Palette, Upload } from 'lucide-react';

interface CreatorProfileWizardProps {
  onComplete: () => void;
}

const CreatorProfileWizard: React.FC<CreatorProfileWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    brand_name: '',
    niche: '',
    target_audience: '',
    content_goals: [] as string[],
    on_camera: false,
    content_format: '',
    personality_traits: [] as string[],
    instagram_handle: ''
  });

  const steps = [
    { id: 1, title: 'Brand Identity', icon: User, description: 'Tell us about your brand' },
    { id: 2, title: 'Content Style', icon: Palette, description: 'Define your content approach' },
    { id: 3, title: 'Content Sources', icon: Upload, description: 'Add your existing content' },
    { id: 4, title: 'Review & Complete', icon: Check, description: 'Review and finalize your profile' }
  ];

  const niches = [
    'Fitness & Health', 'Business & Entrepreneurship', 'Technology', 'Lifestyle', 
    'Education', 'Entertainment', 'Fashion & Beauty', 'Travel', 'Food & Cooking', 
    'Personal Development', 'Finance', 'Gaming', 'Art & Design', 'Music', 'Other'
  ];

  const contentFormats = [
    { value: 'educational', label: 'Educational - Teach and inform' },
    { value: 'entertainment', label: 'Entertainment - Entertain and amuse' },
    { value: 'motivational', label: 'Motivational - Inspire and motivate' },
    { value: 'mixed', label: 'Mixed - Combination of styles' }
  ];

  const personalityTraits = [
    'Energetic', 'Calm', 'Funny', 'Serious', 'Authentic', 'Professional', 
    'Creative', 'Analytical', 'Inspirational', 'Relatable', 'Expert', 'Friendly'
  ];

  const contentGoals = [
    'Build brand awareness', 'Generate leads', 'Educate audience', 'Drive sales',
    'Build community', 'Establish authority', 'Entertain followers', 'Share knowledge'
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTraitToggle = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      personality_traits: prev.personality_traits.includes(trait)
        ? prev.personality_traits.filter(t => t !== trait)
        : [...prev.personality_traits, trait]
    }));
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      content_goals: prev.content_goals.includes(goal)
        ? prev.content_goals.filter(g => g !== goal)
        : [...prev.content_goals, goal]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('creator-profile', {
        body: {
          ...formData,
          profile_status: 'complete'
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to create creator profile",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Your creator profile has been created successfully.",
      });

      onComplete();
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.brand_name && formData.niche && formData.target_audience;
      case 2:
        return formData.content_format && formData.personality_traits.length > 0;
      case 3:
        return true; // Optional step
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="brand_name">Brand/Creator Name *</Label>
              <Input
                id="brand_name"
                value={formData.brand_name}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                placeholder="Your brand or personal name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="niche">Content Niche *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, niche: value }))}>
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
                value={formData.target_audience}
                onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Content Format *</Label>
              {contentFormats.map((format) => (
                <div key={format.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={format.value}
                    checked={formData.content_format === format.value}
                    onCheckedChange={() => setFormData(prev => ({ 
                      ...prev, 
                      content_format: prev.content_format === format.value ? '' : format.value 
                    }))}
                  />
                  <Label htmlFor={format.value} className="text-sm">
                    <span className="font-medium">{format.label.split(' - ')[0]}</span>
                    <span className="text-muted-foreground"> - {format.label.split(' - ')[1]}</span>
                  </Label>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Label>On-Camera Presence</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="on_camera"
                  checked={formData.on_camera}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, on_camera: !!checked }))}
                />
                <Label htmlFor="on_camera" className="text-sm">
                  I appear on camera in my content
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Personality Traits * (Select 3-5 that best describe you)</Label>
              <div className="grid grid-cols-3 gap-2">
                {personalityTraits.map((trait) => (
                  <Badge
                    key={trait}
                    variant={formData.personality_traits.includes(trait) ? "default" : "outline"}
                    className="cursor-pointer justify-center"
                    onClick={() => handleTraitToggle(trait)}
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {formData.personality_traits.length}/5
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="instagram_handle">Instagram Handle (Optional)</Label>
              <Input
                id="instagram_handle"
                value={formData.instagram_handle}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
                placeholder="@yourusername"
              />
              <p className="text-sm text-muted-foreground">
                We can analyze your existing Instagram content to better understand your style
              </p>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Sample Content</h3>
              <p className="text-muted-foreground mb-4">
                Upload videos or scripts to help us understand your style better
              </p>
              <Button variant="outline" disabled>
                Upload Files (Coming Soon)
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">💡 Pro Tip</h4>
              <p className="text-sm text-muted-foreground">
                You can always add content samples later by using our "Analyze Content" feature and saving them as style references.
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
                  <p className="font-medium">{formData.brand_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Niche</Label>
                  <p className="font-medium">{formData.niche}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Target Audience</Label>
                <p className="font-medium">{formData.target_audience}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Content Format</Label>
                <p className="font-medium capitalize">{formData.content_format}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Personality Traits</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.personality_traits.map((trait) => (
                    <Badge key={trait} variant="secondary">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>

              {formData.content_goals.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Content Goals</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.content_goals.map((goal) => (
                      <Badge key={goal} variant="outline">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.instagram_handle && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Instagram</Label>
                  <p className="font-medium">{formData.instagram_handle}</p>
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
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Create Your Creator Profile</CardTitle>
              <CardDescription>
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].description}
              </CardDescription>
            </div>
            <div className="text-right">
              <Progress value={(currentStep / steps.length) * 100} className="w-32" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 ${
                    step.id === currentStep
                      ? 'text-primary'
                      : step.id < currentStep
                      ? 'text-success'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`rounded-full p-2 ${
                      step.id === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step.id < currentStep
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
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Profile...' : 'Complete Profile'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorProfileWizard;