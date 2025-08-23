import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Lock, CreditCard, Check, Star, Zap } from 'lucide-react';

interface ViraltifyCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  planSlug: string;
  planName: string;
  planPrice: number;
  planCredits: number;
}

export const ViraltifyCheckout = ({ 
  isOpen, 
  onClose, 
  planSlug, 
  planName, 
  planPrice, 
  planCredits 
}: ViraltifyCheckoutProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const features = {
    creator: [
      "75 AI-generated scripts per month",
      "Advanced trending discovery",
      "Performance analytics",
      "Priority support",
      "Export to all platforms",
    ],
    pro: [
      "200 AI-generated scripts per month", 
      "Unlimited trending discovery",
      "Advanced analytics & insights",
      "Priority support",
      "Team collaboration (3 members)",
      "Custom brand voice training",
    ],
    team: [
      "700 AI-generated scripts per month",
      "Unlimited everything",
      "Advanced team analytics", 
      "Dedicated account manager",
      "Unlimited team members",
      "Custom integrations",
    ]
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planSlug }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab with better UX
      const checkoutWindow = window.open(data.url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      // Optional: Close modal after opening checkout
      setTimeout(() => {
        onClose();
        toast({
          title: "Checkout opened!",
          description: "Complete your payment in the new tab to activate your subscription.",
        });
      }, 1000);

    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const planFeatures = features[planSlug as keyof typeof features] || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-background via-background/95 to-muted/20 border-border/50 backdrop-blur-sm">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-3xl font-bold text-center">
            <span className="bg-gradient-to-r from-instagram-pink via-instagram-purple to-instagram-orange bg-clip-text text-transparent">
              Upgrade to {planName}
            </span>
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Join thousands of creators making viral content with AI
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Plan Overview Card */}
          <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-instagram-pink to-instagram-purple">
                    {planSlug === 'creator' && <Zap className="h-5 w-5 text-white" />}
                    {planSlug === 'pro' && <CreditCard className="h-5 w-5 text-white" />}
                    {planSlug === 'team' && <Star className="h-5 w-5 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{planName} Plan</h3>
                    <p className="text-muted-foreground">{planCredits} credits per month</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">${planPrice}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                  {planSlug === 'pro' && (
                    <Badge className="mt-1 bg-blue-100 text-blue-800 border-blue-200">
                      Most Popular
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Features List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {planFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security & Trust Indicators */}
          <div className="flex items-center justify-center gap-6 py-4 border border-border/50 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Secured by Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 text-green-500" />
              <span>256-bit SSL encryption</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-instagram-pink to-instagram-purple hover:from-instagram-pink/90 hover:to-instagram-purple/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Starting checkout...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Upgrade Now
                </>
              )}
            </Button>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By upgrading, you agree to our Terms of Service and Privacy Policy.
            Your subscription will automatically renew monthly. Cancel anytime from your billing settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};