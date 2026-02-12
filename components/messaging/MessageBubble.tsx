"use client";

import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { formatMessageTime } from "@/lib/utils/format";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import type { MessageWithSender } from "@/lib/types";

type MessageBubbleProps = {
  message: MessageWithSender;
  isMine: boolean;
  showAvatar: boolean;
  showName: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onRetry?: () => void;
};

function StatusIcon({ status }: { status: MessageWithSender["status"] }) {
  switch (status) {
    case "sending":
      return <Clock size={12} className="text-text-tertiary" strokeWidth={1.5} />;
    case "sent":
      return <Check size={12} className="text-text-tertiary" strokeWidth={1.5} />;
    case "delivered":
      return <CheckCheck size={12} className="text-text-tertiary" strokeWidth={1.5} />;
    case "read":
      return <CheckCheck size={12} className="text-accent" strokeWidth={1.5} />;
    case "failed":
      return <AlertCircle size={12} className="text-destructive" strokeWidth={1.5} />;
    default:
      return null;
  }
}

export function MessageBubble({
  message,
  isMine,
  showAvatar,
  showName,
  onContextMenu,
  onRetry,
}: MessageBubbleProps) {
  if (message.is_deleted) {
    return (
      <div
        className={cn(
          "flex items-end gap-2 px-4",
          isMine ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div className="w-8 shrink-0" />
        <div className="rounded-2xl bg-bg-secondary px-3 py-2">
          <span className="text-sm italic text-text-tertiary">
            Message deleted
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-end gap-2 px-4 animate-message-in",
        isMine ? "flex-row-reverse" : "flex-row"
      )}
      onContextMenu={onContextMenu}
    >
      {/* Avatar space */}
      <div className="w-8 shrink-0">
        {showAvatar && !isMine && message.sender && (
          <Avatar
            src={message.sender.avatar_url}
            displayName={message.sender.display_name}
            userId={message.sender.id}
            size="sm"
          />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-0.5",
          isMine ? "items-end" : "items-start"
        )}
      >
        {showName && !isMine && message.sender && (
          <span className="px-1 text-xs font-medium text-text-secondary">
            {message.sender.display_name}
          </span>
        )}

        {/* Reply quote */}
        {message.reply_to && (
          <div
            className={cn(
              "mx-1 max-w-full rounded-lg border-l-2 border-accent/50 bg-bg-secondary px-2 py-1"
            )}
          >
            <span className="text-xs font-medium text-accent">
              {message.reply_to.sender?.display_name ?? "Unknown"}
            </span>
            <p className="truncate text-xs text-text-tertiary">
              {message.reply_to.content ?? "Media"}
            </p>
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-3 py-2",
            isMine
              ? "rounded-br-md bg-bubble-sent text-bubble-sent-text"
              : "rounded-bl-md bg-bubble-received text-bubble-received-text"
          )}
        >
          <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {groupReactions(message.reactions).map(([emoji, count]) => (
              <span
                key={emoji}
                className="inline-flex items-center gap-0.5 rounded-full bg-bg-secondary px-1.5 py-0.5 text-xs"
              >
                {emoji}
                {count > 1 && (
                  <span className="text-text-tertiary">{count}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp + status */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-text-tertiary">
            {formatMessageTime(message.created_at)}
          </span>
          {message.is_edited && (
            <span className="text-[10px] text-text-tertiary">edited</span>
          )}
          {isMine && <StatusIcon status={message.status} />}
          {message.status === "failed" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[10px] font-medium text-destructive hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function groupReactions(
  reactions: MessageWithSender["reactions"]
): [string, number][] {
  const map = new Map<string, number>();
  for (const r of reactions) {
    map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1);
  }
  return Array.from(map.entries());
}
