import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SidebarCreditWidget } from '@/components/credits/SidebarCreditWidget';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Lightbulb, User, LogOut, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface SidebarProfileSectionProps {
  // Always compact for Canva-style sidebar
}

export function SidebarProfileSection({}: SidebarProfileSectionProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userDisplayName = user.user_metadata?.first_name || 
                         user.user_metadata?.full_name || 
                         user.email?.split('@')[0] || 
                         'User';

  return (
    <div className="p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full h-auto p-2 flex flex-col items-center gap-2 hover:bg-accent/50 text-center"
          >
            <ProfileAvatar 
              user={user} 
              size="sm"
            />
            <div className="flex flex-col items-center min-w-0 w-full">
              <div className="font-medium text-foreground text-xs truncate max-w-full">
                {userDisplayName}
              </div>
              <div className="text-muted-foreground text-xs truncate max-w-full">
                {user.email?.split('@')[0]}
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="center" 
          side="right" 
          className="w-56 bg-popover"
        >          
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link to="/billing" className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setIsFeedbackModalOpen(true)}
            className="flex items-center cursor-pointer"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Suggest Improvement
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive flex items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Compact Credit Widget */}
      <div className="mt-2">
        <SidebarCreditWidget collapsed={true} />
      </div>
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}