import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const Header = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-800 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Viraltify</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">
            Features
          </a>
          <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">
            Pricing
          </a>
          <a href="#reviews" className="text-gray-600 hover:text-gray-900 font-medium">
            Reviews
          </a>
          <a href="#faq" className="text-gray-600 hover:text-gray-900 font-medium">
            FAQ
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-gray-900 font-medium">
            Sign In
          </button>
          <Button
            className="bg-gradient-to-r from-purple-800 to-pink-500 text-white px-6 py-2 hover:opacity-90 shadow-md rounded-lg"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Start Free Trial"}
          </Button>
        </div>
      </div>
    </header>
  );
};