import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthContext";
import { LogOut, User, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CreditMeter } from "@/components/credits/CreditMeter";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/a6a45a07-ab6a-4a98-9503-3624cff4fda0.png" 
                alt="Viraltify logo" 
                className="w-8 h-8"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-instagram-pink to-instagram-purple bg-clip-text text-transparent">
                Viraltify
              </span>
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
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="sm" className="bg-gradient-to-r from-instagram-pink to-instagram-purple">
                    Sign Up for Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};