import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthContext";
import { LogOut, User, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CreditMeter } from "@/components/credits/CreditMeter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const Navbar = () => {
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/7a468b69-3009-4221-9766-43b7b40b274a.png" 
                alt="Viraltify logo" 
                className="w-40 h-40 object-contain"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <CreditMeter />
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/viral-reels">
                  <Button variant="ghost" size="sm">
                    Viral Reels
                  </Button>
                </Link>
                <Link to="/script-generator">
                  <Button variant="ghost" size="sm">
                    Script Generator
                  </Button>
                </Link>
                <Link to="/my-scripts">
                  <Button variant="ghost" size="sm">
                    My Scripts
                  </Button>
                </Link>
                <Link to="/content">
                  <Button variant="ghost" size="sm">
                    Content
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/pricing">
                  <Button variant="ghost" size="sm">
                    Pricing
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleGoogleSignUp} disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-instagram-pink to-instagram-purple" onClick={handleGoogleSignUp} disabled={loading}>
                  {loading ? "Signing up..." : "Sign Up for Free"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};