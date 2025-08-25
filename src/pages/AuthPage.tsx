import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthContext";
import { generateSecurePassword, contentValidationSchemas, validateAndSanitize, logSecurityEvent } from "@/lib/security";

export const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Add error boundary protection
  const [componentError, setComponentError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      if (user) {
        console.log('AuthPage: User authenticated, redirecting to dashboard');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('AuthPage: Error in user effect', error);
      setComponentError(error as Error);
    }
  }, [user, navigate]);

  useEffect(() => {
    try {
      // Use secure email validation
      const emailValidation = validateAndSanitize(email, contentValidationSchemas.email);
      setIsValidEmail(emailValidation.success);
    } catch (error) {
      console.error('AuthPage: Error in email validation', error);
      setComponentError(error as Error);
    }
  }, [email]);

  // Rate limiting effect
  useEffect(() => {
    if (authAttempts >= 5) {
      setRateLimited(true);
      logSecurityEvent('auth_rate_limit_exceeded', { 
        attempts: authAttempts, 
        timestamp: new Date().toISOString() 
      });
      
      // Reset after 15 minutes
      const timer = setTimeout(() => {
        setRateLimited(false);
        setAuthAttempts(0);
      }, 15 * 60 * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [authAttempts]);

  // Show error if component error occurred
  if (componentError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-xl font-semibold text-destructive mb-4">Component Error</h2>
          <p className="text-muted-foreground mb-4">
            {componentError.message || 'An error occurred in the authentication page'}
          </p>
          <Button onClick={() => setComponentError(null)} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const handleEmailSignUp = async () => {
    if (!isValidEmail || rateLimited) return;
    
    try {
      setEmailLoading(true);
      setAuthAttempts(prev => prev + 1);
      
      // Log security event
      logSecurityEvent('email_auth_attempt', { 
        email: email.substring(0, 3) + '*'.repeat(email.length - 6) + email.slice(-3),
        timestamp: new Date().toISOString()
      });
      
      console.log('AuthPage: Starting email signup process');
      
      // Use secure password generation instead of predictable pattern
      const securePassword = generateSecurePassword();
      
      const { error } = await supabase.auth.signUp({
        email,
        password: securePassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        console.error('AuthPage: Email signup error', error);
        logSecurityEvent('email_auth_failure', { 
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      console.log('AuthPage: Email signup successful');
      logSecurityEvent('email_auth_success', { 
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in.",
      });
    } catch (error: any) {
      console.error('AuthPage: Email signup catch block', error);
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
    if (rateLimited) return;
    
    try {
      setGoogleLoading(true);
      setAuthAttempts(prev => prev + 1);
      
      // Log security event
      logSecurityEvent('google_auth_attempt', { 
        timestamp: new Date().toISOString()
      });
      
      console.log('AuthPage: Starting Google signin process');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        console.error('AuthPage: Google signin error', error);
        logSecurityEvent('google_auth_failure', { 
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
      
      logSecurityEvent('google_auth_success', { 
        timestamp: new Date().toISOString()
      });
      
      console.log('AuthPage: Google signin initiated successfully');
    } catch (error: any) {
      console.error('AuthPage: Google signin catch block', error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/20438a19-0f33-4e14-ad03-f2ce206ada62.png" 
              alt="Viraltify" 
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Sign up or log in
          </h1>
          <p className="text-muted-foreground">
            Enter your email to get started
          </p>
        </div>

        {/* Auth Form */}
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
          
          <Button 
            onClick={handleEmailSignUp}
            disabled={!isValidEmail || emailLoading || rateLimited}
            className="w-full"
          >
            {rateLimited 
              ? "Too many attempts - try again later" 
              : emailLoading 
                ? "Sending..." 
                : "Continue"
            }
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || rateLimited}
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {rateLimited 
              ? "Rate limited" 
              : googleLoading 
                ? "Signing in..." 
                : "Continue with Google"
            }
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-foreground">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};