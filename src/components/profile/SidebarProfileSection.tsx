import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SidebarCreditWidget } from '@/components/credits/SidebarCreditWidget';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SidebarProfileSectionProps {
  // Always compact for Canva-style sidebar
}

export function SidebarProfileSection({}: SidebarProfileSectionProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
    <div className="p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full h-auto p-2 flex items-center gap-3 hover:bg-accent/50 justify-start"
          >
            <ProfileAvatar 
              user={user} 
              size="sm" 
            />
            <div className="flex flex-col items-start min-w-0 flex-1">
              <div className="font-medium text-foreground text-sm truncate max-w-full">
                {userDisplayName}
              </div>
              <div className="text-muted-foreground text-xs truncate max-w-full">
                {user.email}
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
            <Link to="/settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
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
      
      {/* Credit Widget */}
      <div className="mt-3">
        <SidebarCreditWidget collapsed={false} />
      </div>
    </div>
  );
}