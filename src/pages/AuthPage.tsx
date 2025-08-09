import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthContext";
import { useEffect } from "react";
import { Zap, Mail, Lock, User } from "lucide-react";

export const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          throw error;
        }

        setEmailSent(true);
        toast({
          title: "Reset link sent",
          description: "Check your email for a password reset link.",
        });
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
            setIsSignUp(false);
          } else {
            throw error;
          }
        } else {
          setEmailSent(true);
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to complete your registration.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive",
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: "Email not verified",
              description: "Please check your email and click the verification link before signing in.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password: "temp", // This won't create a new account, just resend confirmation
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error && !error.message.includes('already registered')) {
        throw error;
      }

      toast({
        title: "Email resent",
        description: "We've sent another verification email to your inbox.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to resend email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsSignUp(false);
    setIsForgotPassword(false);
    setEmailSent(false);
    setEmail("");
    setPassword("");
    setFullName("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-instagram-pink/10 via-instagram-purple/10 to-instagram-orange/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-instagram-pink to-instagram-purple bg-clip-text text-transparent">
            Welcome to Viraltify
          </h1>
          <p className="text-muted-foreground mt-2">
            {isForgotPassword 
              ? "Reset your password" 
              : isSignUp 
                ? "Create your account to start going viral" 
                : "Sign in to your account"
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isForgotPassword ? "Reset Password" : isSignUp ? "Create Account" : "Sign In"}
            </CardTitle>
            <CardDescription>
              {isForgotPassword 
                ? "Enter your email to receive a password reset link"
                : isSignUp 
                  ? "Enter your details to create your Viraltify account" 
                  : "Enter your credentials to access your account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-200">
                    {isForgotPassword ? "Password reset link sent!" : "Verification email sent!"}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Check your email and follow the instructions to continue.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    disabled={loading}
                    className="w-full"
                  >
                    Resend Email
                  </Button>
                  
                  <Button
                    onClick={resetForm}
                    variant="ghost"
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && !isForgotPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {!isForgotPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10"
                          minLength={6}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-instagram-pink to-instagram-purple hover:opacity-90"
                    disabled={loading}
                  >
                    {loading 
                      ? "Loading..." 
                      : isForgotPassword 
                        ? "Send Reset Link"
                        : isSignUp 
                          ? "Create Account" 
                          : "Sign In"
                    }
                  </Button>
                </form>

                <div className="mt-6 space-y-4">
                  {!isSignUp && !isForgotPassword && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (isForgotPassword) {
                          setIsForgotPassword(false);
                        } else {
                          setIsSignUp(!isSignUp);
                        }
                      }}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {isForgotPassword
                        ? "Back to Sign In"
                        : isSignUp 
                          ? "Already have an account? Sign in" 
                          : "Don't have an account? Sign up"
                      }
                    </button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};