import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthContext";
import { Zap, ArrowLeft, Check, Instagram, Youtube } from "lucide-react";

export const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(email));
  }, [email]);

  const handleEmailSignUp = async () => {
    if (!isValidEmail) return;
    
    try {
      setEmailLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password: 'temp-password-' + Math.random().toString(36),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in.",
      });
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign up with email.",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
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
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-[1fr_1.2fr] h-screen">
        {/* Left Column - Auth Form */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
          <div className="mx-auto w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
              
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-instagram flex items-center justify-center mr-3">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold">Viraltify</span>
              </div>
              
              <h1 className="text-2xl font-semibold tracking-tight mb-2">
                Enter your company email
              </h1>
              <p className="text-muted-foreground">
                to continue to Viraltify
              </p>
            </div>

            {/* Email Form */}
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                />
                {isValidEmail && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              
              <Button 
                onClick={handleEmailSignUp}
                disabled={!isValidEmail || emailLoading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {emailLoading ? "Sending..." : "Continue"}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    OR SIGN UP WITH
                  </span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? "Signing in..." : "Continue with Google"}
              </Button>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already using Viraltify?{" "}
              <Link to="/signin" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right Column - Branding */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center bg-gradient-subtle px-12 py-16">
          <div className="mx-auto max-w-md">
            <h2 className="text-3xl font-bold tracking-tight mb-6">
              Future-proof with a flexible content strategy
            </h2>
            
            <div className="bg-background/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
              <div className="flex items-start space-x-4">
                <img
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=48&h=48&fit=crop&crop=face"
                  alt="Creator"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="text-foreground/90 mb-2">
                    "Viraltify helped me grow from 10K to 500K followers in just 6 months. 
                    The insights are incredible!"
                  </p>
                  <div className="text-sm">
                    <div className="font-medium text-foreground">Sarah Martinez</div>
                    <div className="text-muted-foreground">@sarahcreates • 500K followers</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                Trusted by creators on
              </p>
              <div className="grid grid-cols-4 gap-6 items-center opacity-70">
                <div className="flex items-center justify-center">
                  <Instagram className="w-8 h-8" />
                </div>
                <div className="flex items-center justify-center">
                  <Youtube className="w-8 h-8" />
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.098.118.112.222.082.343-.09.369-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </div>
                <div className="flex items-center justify-center text-lg font-bold">
                  TikTok
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};