"use client";

import { cn } from "@/lib/cn";
import { getInitials, getAvatarColor } from "@/lib/utils/format";
import { useState } from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: "h-6 w-6", text: "text-[8px]", dot: "h-2 w-2 -right-0 -bottom-0" },
  sm: { container: "h-8 w-8", text: "text-xs", dot: "h-2.5 w-2.5 -right-0.5 -bottom-0.5" },
  md: { container: "h-10 w-10", text: "text-sm", dot: "h-3 w-3 -right-0.5 -bottom-0.5" },
  lg: { container: "h-14 w-14", text: "text-base", dot: "h-3.5 w-3.5 -right-0.5 -bottom-0.5" },
  xl: { container: "h-20 w-20", text: "text-lg", dot: "h-4 w-4 -right-1 -bottom-1" },
};

type AvatarProps = {
  src?: string | null;
  displayName: string;
  userId: string;
  size?: AvatarSize;
  isOnline?: boolean;
  className?: string;
};

export function Avatar({
  src,
  displayName,
  userId,
  size = "md",
  isOnline,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const s = sizeMap[size];
  const showImage = src && !imgError;
  const bgColor = getAvatarColor(userId);

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {showImage ? (
        <img
          src={src}
          alt={displayName}
          onError={() => setImgError(true)}
          className={cn(s.container, "rounded-full object-cover")}
        />
      ) : (
        <div
          className={cn(
            s.container,
            "flex items-center justify-center rounded-full font-medium text-white"
          )}
          style={{ backgroundColor: bgColor }}
        >
          <span className={s.text}>{getInitials(displayName)}</span>
        </div>
      )}

      {isOnline !== undefined && isOnline && (
        <span
          className={cn(
            s.dot,
            "absolute rounded-full border-2 border-bg-primary bg-success"
          )}
        />
      )}
    </div>
  );
}
