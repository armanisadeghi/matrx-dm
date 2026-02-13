"use client";

import { cn } from "@/lib/cn";
import { Avatar, IconButton } from "@/components/ui";
import { ArrowLeft, Phone, Video } from "lucide-react";
import { useRouter } from "next/navigation";

type ConversationHeaderProps = {
  name: string;
  avatarUrl?: string | null;
  conversationId: string;
  conversationType: string;
  isOnline?: boolean;
  memberCount?: number;
  typingUsers?: string[];
  className?: string;
};

export function ConversationHeader({
  name,
  avatarUrl,
  conversationId,
  conversationType,
  isOnline,
  memberCount,
  typingUsers = [],
  className,
}: ConversationHeaderProps) {
  const router = useRouter();

  function getSubtitle(): string {
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2)
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    if (typingUsers.length > 2) return "Several people are typing...";
    if (conversationType === "group" && memberCount)
      return `${memberCount} members`;
    if (isOnline) return "Online";
    return "";
  }

  const subtitle = getSubtitle();

  return (
    <header
      className={cn(
        "pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-center px-2 pb-3 pt-2",
        className
      )}
      style={{
        background: "linear-gradient(to bottom, var(--bg-primary) 0%, var(--bg-primary) 30%, transparent 100%)",
      }}
    >
      {/* Left: Back button (mobile only) */}
      <div className="flex min-w-[48px] items-center sm:hidden">
        <IconButton
          icon={ArrowLeft}
          label="Back to conversations"
          size="sm"
          variant="ghost"
          onClick={() => router.push("/messages")}
        />
      </div>

      {/* Spacer for desktop (left side balance) */}
      <div className="hidden min-w-[48px] sm:block" />

      {/* Center: Avatar + Name (clickable for info) */}
      <button
        type="button"
        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-0"
        onClick={() => router.push(`/messages/${conversationId}/info`)}
        aria-label="Conversation info"
      >
        <Avatar
          src={avatarUrl}
          displayName={name}
          userId={conversationId}
          size="sm"
          isOnline={isOnline}
        />
        <span className="-mt-1 truncate text-xs font-semibold text-text-primary">
          {name}
        </span>
        {subtitle && (
          <span
            className={cn(
              "truncate text-[10px] leading-tight",
              typingUsers.length > 0 ? "text-accent" : "text-text-secondary"
            )}
          >
            {subtitle}
          </span>
        )}
      </button>

      {/* Right: Call actions */}
      <div className="flex min-w-[48px] items-center justify-end gap-0.5">
        <IconButton icon={Phone} label="Voice call" size="sm" variant="ghost" />
        <IconButton icon={Video} label="Video call" size="sm" variant="ghost" />
      </div>
    </header>
  );
}
