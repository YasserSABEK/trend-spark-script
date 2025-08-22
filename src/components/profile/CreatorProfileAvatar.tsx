import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreatorProfileAvatarProps {
  profilePhotoUrl?: string | object;
  creatorName: string;
  size?: "sm" | "default" | "lg";
}

export function CreatorProfileAvatar({ profilePhotoUrl, creatorName, size = "default" }: CreatorProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10", 
    lg: "h-16 w-16",
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || "CR";
  };

  // Extract URL from profile photo data
  const getProfilePhotoUrl = () => {
    if (!profilePhotoUrl) return null;
    
    if (typeof profilePhotoUrl === 'string') {
      return profilePhotoUrl;
    }
    
    if (typeof profilePhotoUrl === 'object' && profilePhotoUrl !== null) {
      // Handle JSON object format from database
      const photoData = profilePhotoUrl as any;
      return photoData.url || photoData.profilePhotoUrl || null;
    }
    
    return null;
  };

  const imageUrl = getProfilePhotoUrl();
  const shouldShowImage = imageUrl && !imageError;

  return (
    <Avatar className={sizeClasses[size]}>
      {shouldShowImage && (
        <AvatarImage 
          src={imageUrl} 
          alt={`${creatorName} profile picture`}
          onError={() => setImageError(true)}
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-instagram-pink to-instagram-purple text-white font-medium">
        {getInitials(creatorName)}
      </AvatarFallback>
    </Avatar>
  );
}