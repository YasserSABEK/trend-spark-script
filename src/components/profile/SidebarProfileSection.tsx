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
import { Settings, User, LogOut, MoreHorizontal } from 'lucide-react';
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
    <div className="flex flex-col items-center space-y-3 p-3">
      {/* Profile Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto p-1 rounded-full">
            <ProfileAvatar user={user} size="sm" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="right" className="w-56 ml-2">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium truncate" title={userDisplayName}>{userDisplayName}</p>
              <p className="text-xs text-muted-foreground truncate" title={user.email}>{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Three dots for additional actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="right" className="w-48 ml-2">
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Compact Credit Widget */}
      <SidebarCreditWidget collapsed={true} />
    </div>
  );
}