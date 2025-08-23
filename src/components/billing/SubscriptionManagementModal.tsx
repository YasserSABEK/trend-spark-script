import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  Crown, 
  CreditCard, 
  Star, 
  Zap, 
  AlertTriangle, 
  ExternalLink,
  Calendar,
  DollarSign
} from 'lucide-react';

interface SubscriptionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: any; // Use any to match the plan structure from useCreditBalance
  subscription?: {
    current_period_end?: string;
  };
}

const planDetails = {
  free: { name: 'Free', price: '$0', icon: Star, color: 'bg-slate-500' },
  starter: { name: 'Starter', price: '$19', icon: Zap, color: 'bg-blue-500' },
  pro: { name: 'Pro', price: '$49', icon: CreditCard, color: 'bg-purple-500' },
  agency: { name: 'Agency', price: '$99', icon: Crown, color: 'bg-amber-500' }
};

export const SubscriptionManagementModal = ({ 
  isOpen, 
  onClose, 
  currentPlan,
  subscription
}: SubscriptionManagementModalProps) => {
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [selectedDowngrade, setSelectedDowngrade] = useState<string>('');

  const currentPlanDetails = planDetails[currentPlan.slug as keyof typeof planDetails];
  const CurrentIcon = currentPlanDetails?.icon || Star;

  const getDowngradeOptions = () => {
    switch (currentPlan.slug) {
      case 'agency':
        return [
          { slug: 'pro', name: 'Pro', price: '$49', savings: '$50' },
          { slug: 'starter', name: 'Starter', price: '$19', savings: '$80' }
        ];
      case 'pro':
        return [
          { slug: 'starter', name: 'Starter', price: '$19', savings: '$30' }
        ];
      default:
        return [];
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Subscription cancelled successfully. You can continue using your current plan until the end of your billing period.');
      onClose();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setLoading(false);
      setShowCancelConfirm(false);
    }
  };

  const handleDowngrade = async (targetPlan: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('downgrade-subscription', {
        body: { targetPlan }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Successfully downgraded to ${planDetails[targetPlan as keyof typeof planDetails].name} plan!`);
      onClose();
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      toast.error('Failed to downgrade subscription. Please try again or contact support.');
    } finally {
      setLoading(false);
      setShowDowngradeConfirm(false);
    }
  };

  const handleManagePayment = () => {
    supabase.functions.invoke('customer-portal').then(({ data }) => {
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    });
  };

  const downgrades = getDowngradeOptions();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-background via-background/95 to-muted/20 border-border/50 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Manage Your Subscription
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Plan Overview */}
          <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${currentPlanDetails?.color || 'bg-slate-500'}`}>
                    <CurrentIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{currentPlan.name} Plan</h3>
                    <p className="text-muted-foreground">
                      {currentPlan.slug === 'agency' ? 'Unlimited credits' : `${currentPlan.monthly_credits || 0} credits`} per month
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${currentPlan.price_usd || 0}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>
              
              {subscription?.current_period_end && (
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Renews on {new Date(subscription.current_period_end).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {!showCancelConfirm && !showDowngradeConfirm && (
            <div className="space-y-4">
              {/* Downgrade Options */}
              {downgrades.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Downgrade Options</h4>
                  {downgrades.map((downgrade) => {
                    const DowngradeIcon = planDetails[downgrade.slug as keyof typeof planDetails].icon;
                    return (
                      <Card key={downgrade.slug} className="cursor-pointer hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-muted">
                                <DowngradeIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{downgrade.name} Plan</p>
                                <p className="text-sm text-muted-foreground">{downgrade.price}/month</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Save {downgrade.savings}/mo
                              </Badge>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedDowngrade(downgrade.slug);
                                  setShowDowngradeConfirm(true);
                                }}
                              >
                                Downgrade
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleManagePayment}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Payment Methods
                  <ExternalLink className="h-3 w-3" />
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`${window.location.origin}/billing`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Billing History
                  <ExternalLink className="h-3 w-3" />
                </Button>

                {currentPlan.slug !== 'free' && (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-destructive mb-2">Cancel Subscription</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your subscription will be cancelled at the end of your current billing period 
                      ({subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'billing period'}). 
                      You'll continue to have access to all features until then.
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={loading}
                      >
                        Keep Subscription
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Cancelling...
                          </>
                        ) : (
                          'Confirm Cancellation'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Downgrade Confirmation */}
          {showDowngradeConfirm && selectedDowngrade && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-800 mb-2">Confirm Downgrade</h4>
                    <p className="text-sm text-orange-700 mb-4">
                      You're about to downgrade to the {planDetails[selectedDowngrade as keyof typeof planDetails].name} plan. 
                      This change will take effect immediately and you'll be prorated for the difference.
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowDowngradeConfirm(false);
                          setSelectedDowngrade('');
                        }}
                        disabled={loading}
                      >
                        Keep Current Plan
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleDowngrade(selectedDowngrade)}
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Downgrading...
                          </>
                        ) : (
                          'Confirm Downgrade'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};