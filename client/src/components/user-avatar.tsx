import { useEffect, useState } from "react";

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  alt?: string;
}

export function UserAvatar({
  name,
  imageUrl,
  className = "",
  imageClassName = "",
  fallbackClassName = "",
  alt,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
      aria-label={alt ?? `${name}'s profile photo`}
    >
      {showImage ? (
        <img
          src={imageUrl!}
          alt={alt ?? `${name}'s profile photo`}
          className={`h-full w-full object-cover ${imageClassName}`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={`flex h-full w-full items-center justify-center ${fallbackClassName}`}>
          {getInitials(name)}
        </span>
      )}
    </span>
  );
}