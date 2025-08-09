import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data.session) {
          toast({
            title: "Welcome!",
            description: "Your account has been verified successfully.",
          });
          navigate('/dashboard');
        } else {
          // Check for auth confirmation in URL
          const { data: authData, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            throw authError;
          }

          if (authData.user) {
            toast({
              title: "Email verified!",
              description: "Your account has been verified. Please sign in.",
            });
            navigate('/auth');
          } else {
            toast({
              title: "Verification complete",
              description: "Please sign in to your account.",
            });
            navigate('/auth');
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        toast({
          title: "Verification failed",
          description: error.message || "There was an issue verifying your account.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-instagram-pink/10 via-instagram-purple/10 to-instagram-orange/10">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-instagram-purple" />
        <h2 className="text-xl font-semibold mb-2">Verifying your account...</h2>
        <p className="text-muted-foreground">Please wait while we confirm your email.</p>
      </div>
    </div>
  );
};