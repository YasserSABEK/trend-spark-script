import { useState } from "react";
import { X, Lightbulb, Bug, FileText, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = "improvement" | "bug" | null;

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackType || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_feedback").insert({
        feedback_type: feedbackType,
        subject: subject.trim() || null,
        message: message.trim(),
        status: "new"
      });

      if (error) throw error;

      toast({
        title: "Thank you for your feedback!",
        description: "We'll review your suggestion and get back to you soon.",
      });

      // Reset form and close modal
      setFeedbackType(null);
      setSubject("");
      setMessage("");
      onClose();
    } catch (error) {
      toast({
        title: "Error submitting feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedbackType(null);
    setSubject("");
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Give feedback or report a bug
          </DialogTitle>
        </DialogHeader>

        {!feedbackType ? (
          <div className="space-y-4 py-4">
            <Button
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-center space-y-3 hover:bg-muted/50"
              onClick={() => setFeedbackType("improvement")}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-medium">Help us improve</h3>
                <p className="text-sm text-muted-foreground">
                  Share ideas to make our product better
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-center space-y-3 hover:bg-muted/50"
              onClick={() => setFeedbackType("bug")}
            >
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Bug className="w-6 h-6 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="font-medium">Report a bug</h3>
                <p className="text-sm text-muted-foreground">
                  Let us know about issues you've encountered
                </p>
              </div>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input
                id="subject"
                placeholder={
                  feedbackType === "improvement"
                    ? "Brief description of your suggestion"
                    : "What went wrong?"
                }
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                {feedbackType === "improvement" ? "Your suggestion" : "Describe the bug"} *
              </Label>
              <Textarea
                id="message"
                placeholder={
                  feedbackType === "improvement"
                    ? "Tell us about your idea and how it would help..."
                    : "What happened? What were you trying to do? Include steps to reproduce if possible..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFeedbackType(null)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={!message.trim() || isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}