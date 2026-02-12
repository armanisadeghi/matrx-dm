"use client";

import { cn } from "@/lib/cn";
import { Avatar, Badge } from "@/components/ui";
import { formatTimestamp, formatMessagePreview } from "@/lib/utils/format";
import { BellOff, Pin } from "lucide-react";
import type { ConversationWithDetails } from "@/lib/types";

type ConversationListItemProps = {
  conversation: ConversationWithDetails;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
};

export function ConversationListItem({
  conversation,
  isActive,
  onClick,
  onContextMenu,
}: ConversationListItemProps) {
  const preview = formatMessagePreview(
    conversation.last_message_content,
    conversation.last_message_type
  );
  const time = conversation.last_message_created_at
    ? formatTimestamp(conversation.last_message_created_at)
    : "";

  const displayName =
    conversation.conversation_name || "Unknown Conversation";
  const avatarUrl = conversation.conversation_avatar_url;

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3",
        "min-h-[68px] cursor-pointer text-left",
        "transition-colors duration-[var(--duration-fast)]",
        "hover:bg-bg-secondary active:bg-bg-tertiary",
        isActive && "bg-accent/15"
      )}
    >
      <Avatar
        src={avatarUrl}
        displayName={displayName}
        userId={conversation.conversation_id}
        size="md"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-md font-medium",
              conversation.unread_count > 0
                ? "text-text-primary"
                : "text-text-primary"
            )}
          >
            {displayName}
          </span>
          <span className="shrink-0 text-xs text-text-tertiary">{time}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              conversation.unread_count > 0
                ? "font-medium text-text-secondary"
                : "text-text-tertiary"
            )}
          >
            {conversation.last_message_sender_name && conversation.conversation_type === "group"
              ? `${conversation.last_message_sender_name}: ${preview}`
              : preview}
          </span>

          <div className="flex shrink-0 items-center gap-1.5">
            {conversation.is_muted && (
              <BellOff size={14} className="text-text-tertiary" strokeWidth={1.5} />
            )}
            {conversation.is_pinned && (
              <Pin size={14} className="text-text-tertiary" strokeWidth={1.5} />
            )}
            <Badge count={conversation.unread_count} />
          </div>
        </div>
      </div>
    </button>
  );
}
