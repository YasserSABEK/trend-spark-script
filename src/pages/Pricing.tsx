import { useState } from "react";
import { Check, Zap, Crown, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleSignupPopup } from "@/components/GoogleSignupPopup";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

const Pricing = () => {
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const { user } = useAuth();

  const handleUpgrade = async (planSlug: string) => {
    if (!user) {
      setShowGooglePopup(true);
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planSlug }
      });
      
      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process');
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      credits: "10 credits/month",
      features: [
        "10 AI-generated scripts",
        "Basic trending content discovery",
        "Limited analytics",
        "Community support"
      ],
      buttonText: "Sign up with Google",
      isPrimary: false,
      icon: <Zap className="w-5 h-5" />
    },
    {
      name: "Creator",
      price: "$19",
      period: "per month",
      description: "For serious content creators",
      credits: "75 credits/month",
      features: [
        "75 AI-generated scripts",
        "Advanced trending discovery",
        "Performance analytics",
        "Priority support",
        "Export to all platforms",
        "Viral score predictions"
      ],
      buttonText: "Sign up with Google",
      isPrimary: true,
      icon: <Crown className="w-5 h-5" />
    },
    {
      name: "Pro",
      price: "$39",
      period: "per month", 
      description: "For power creators and small teams",
      credits: "200 credits/month",
      features: [
        "200 AI-generated scripts",
        "Unlimited trending discovery",
        "Advanced analytics & insights",
        "Priority support",
        "Team collaboration (3 members)",
        "Custom brand voice training",
        "API access"
      ],
      buttonText: "Sign up with Google",
      isPrimary: false,
      icon: <Users className="w-5 h-5" />
    },
    {
      name: "Team",
      price: "$99",
      period: "per month",
      description: "For agencies and large teams",
      credits: "700 credits/month",
      features: [
        "700 AI-generated scripts",
        "Unlimited everything",
        "Advanced team analytics",
        "Dedicated account manager",
        "Unlimited team members",
        "Custom integrations",
        "White-label options"
      ],
      buttonText: "Contact Sales",
      isPrimary: false,
      icon: <Users className="w-5 h-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-600/30 rounded-full px-4 py-2 mb-6">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-200">Simple, transparent pricing</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Choose your{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              viral growth
            </span>{" "}
            plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include our core features to help you create viral content faster.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-gradient-to-b from-gray-900 to-gray-800 border rounded-2xl p-6 ${
                plan.isPrimary 
                  ? "border-purple-600 ring-2 ring-purple-600/20" 
                  : "border-gray-700"
              }`}
            >
              {plan.isPrimary && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg">
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400">/{plan.period}</span>
                </div>
                <p className="text-purple-400 font-medium mt-1">{plan.credits}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {plan.name !== "Team" && "Additional credits: $0.50 each"}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-12 ${
                  plan.name === "Team"
                    ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    : plan.isPrimary
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
                onClick={() => {
                  if (plan.name === "Team") {
                    // Handle contact sales
                    window.location.href = "mailto:sales@viraltify.com";
                  } else if (plan.name === "Free") {
                    setShowGooglePopup(true);
                  } else {
                    handleUpgrade(plan.name.toLowerCase());
                  }
                }}
              >
                {plan.name !== "Team" && (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                question: "Can I change plans anytime?",
                answer: "Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately."
              },
              {
                question: "What happens if I exceed my credit limit?",
                answer: "You can purchase additional credits for $0.50 each, or upgrade to a higher plan for better value."
              },
              {
                question: "Do you offer refunds?",
                answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked."
              },
              {
                question: "Is there a free trial?",
                answer: "Our Free plan is actually free forever with 10 credits per month. No credit card required to start."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GoogleSignupPopup 
        isOpen={showGooglePopup} 
        onClose={() => setShowGooglePopup(false)} 
      />
    </div>
  );
};

export default Pricing;