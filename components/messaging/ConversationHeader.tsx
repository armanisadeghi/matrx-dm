"use client";

import { cn } from "@/lib/cn";
import { Avatar, IconButton } from "@/components/ui";
import { ArrowLeft, Phone, Video, Info } from "lucide-react";
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
        "flex items-center gap-3 px-2 py-2 glass",
        "border-b border-glass-border",
        className
      )}
    >
      {/* Back button — visible on mobile only */}
      <div className="lg:hidden">
        <IconButton
          icon={ArrowLeft}
          label="Back to conversations"
          size="sm"
          variant="ghost"
          onClick={() => router.push("/messages")}
        />
      </div>

      <Avatar
        src={avatarUrl}
        displayName={name}
        userId={conversationId}
        size="md"
        isOnline={isOnline}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-md font-semibold text-text-primary">
          {name}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "truncate text-xs",
              typingUsers.length > 0 ? "text-accent" : "text-text-secondary"
            )}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <IconButton icon={Phone} label="Voice call" size="sm" variant="ghost" />
        <IconButton icon={Video} label="Video call" size="sm" variant="ghost" />
        <IconButton icon={Info} label="Conversation info" size="sm" variant="ghost" />
      </div>
    </header>
  );
}
