import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface WizardResumeModalProps {
  isOpen: boolean;
  onResume: () => void;
  onStartFresh: () => void;
  currentStep: number;
  totalSteps: number;
  brandName?: string;
}

const WizardResumeModal: React.FC<WizardResumeModalProps> = ({
  isOpen,
  onResume,
  onStartFresh,
  currentStep,
  totalSteps,
  brandName
}) => {
  const progress = ((currentStep - 1) / totalSteps) * 100;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Continue Where You Left Off?</DialogTitle>
          <DialogDescription>
            We found a saved profile creation session{brandName ? ` for "${brandName}"` : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>Step {currentStep} of {totalSteps}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <p className="text-sm text-muted-foreground">
            You can continue from where you left off or start fresh.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onStartFresh} className="w-full sm:w-auto">
            Start Fresh
          </Button>
          <Button onClick={onResume} className="w-full sm:w-auto">
            Continue Setup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WizardResumeModal;