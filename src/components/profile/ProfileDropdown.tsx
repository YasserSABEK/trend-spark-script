import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronUp, User, LogOut, Mail, UserCog, Lightbulb } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthContext";
import { ProfileAvatar } from "./ProfileAvatar";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";

interface ProfileDropdownProps {
  collapsed: boolean;
}

export function ProfileDropdown({ collapsed }: ProfileDropdownProps) {
  const { user, signOut } = useAuth();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  const userEmail = user.email || "";
  const userName = user.user_metadata?.first_name || userEmail.split("@")[0];

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0">
            <ProfileAvatar user={user} size="sm" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center space-x-2 p-2">
            <ProfileAvatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/creator-profile" className="flex items-center space-x-2">
              <UserCog className="w-4 h-4" />
              <span>Creator Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Manage Account</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsFeedbackModalOpen(true)}>
            <Lightbulb className="w-4 h-4 mr-2" />
            <span>Suggest Improvement</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
        <FeedbackModal 
          isOpen={isFeedbackModalOpen} 
          onClose={() => setIsFeedbackModalOpen(false)} 
        />
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-2 h-auto hover:bg-sidebar-accent rounded-lg"
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <ProfileAvatar user={user} size="default" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {userEmail}
              </p>
            </div>
          </div>
          <ChevronUp className="w-4 h-4 text-sidebar-foreground/70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/creator-profile" className="flex items-center space-x-2">
            <UserCog className="w-4 h-4" />
            <span>Creator Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Manage Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsFeedbackModalOpen(true)}>
          <Lightbulb className="w-4 h-4 mr-2" />
          <span>Suggest Improvement</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
        </DropdownMenuContent>
        <FeedbackModal 
          isOpen={isFeedbackModalOpen} 
          onClose={() => setIsFeedbackModalOpen(false)} 
        />
      </DropdownMenu>
    );
}