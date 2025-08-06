import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileAvatarProps {
  user: User;
  size?: "sm" | "default" | "lg";
}

export function ProfileAvatar({ user, size = "default" }: ProfileAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const getInitials = (user: User) => {
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    const email = user.email || "";
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    
    return email[0]?.toUpperCase() || "U";
  };

  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <Avatar className={sizeClasses[size]}>
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt="Profile picture" />
      )}
      <AvatarFallback className="bg-gradient-to-br from-instagram-pink to-instagram-purple text-white font-medium">
        {getInitials(user)}
      </AvatarFallback>
    </Avatar>
  );
}