"use client";

import { cn } from "@/lib/cn";

type TypingIndicatorProps = {
  typingUsers: string[];
  className?: string;
};

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  let text = "";
  if (typingUsers.length === 1) {
    text = `${typingUsers[0]} is typing`;
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0]} and ${typingUsers[1]} are typing`;
  } else {
    text = "Several people are typing";
  }

  return (
    <div className={cn("flex items-center gap-2 px-4 py-1.5", className)}>
      {/* Animated dots */}
      <div className="flex items-center gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-text-tertiary">{text}</span>
    </div>
  );
}
