"use client";

import { cn } from "@/lib/cn";
import { formatMessageTime } from "@/lib/utils/format";
import type { MessageWithSender } from "@/lib/types";

type MessageBubbleProps = {
  message: MessageWithSender;
  isMine: boolean;
  isLastInGroup: boolean;
  isLastFromMe: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onRetry?: () => void;
};

function StatusText({ status }: { status: MessageWithSender["status"] }) {
  switch (status) {
    case "sending":
      return (
        <span className="text-[10px] text-text-tertiary">Sending...</span>
      );
    case "sent":
    case "delivered":
      return (
        <span className="text-[10px] text-text-tertiary">Delivered</span>
      );
    case "read":
      return <span className="text-[10px] text-accent">Read</span>;
    case "failed":
      return (
        <span className="text-[10px] font-medium text-destructive">
          Not Delivered
        </span>
      );
    default:
      return null;
  }
}

export function MessageBubble({
  message,
  isMine,
  isLastInGroup,
  isLastFromMe,
  onContextMenu,
  onRetry,
}: MessageBubbleProps) {
  if (message.is_deleted) {
    return (
      <div
        className={cn(
          "flex px-2",
          isMine ? "justify-end" : "justify-start"
        )}
      >
        <div className="rounded-2xl bg-bg-secondary px-3 py-1.5">
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
        "group flex animate-message-in px-2",
        isMine ? "justify-end" : "justify-start"
      )}
      onContextMenu={onContextMenu}
    >
      {/* Bubble container */}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-0.5",
          isMine ? "items-end" : "items-start"
        )}
      >
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
            "rounded-2xl px-3 py-1.5",
            isMine
              ? cn(
                  "bg-bubble-sent text-bubble-sent-text",
                  isLastInGroup ? "bubble-tail-right" : "rounded-br-md"
                )
              : cn(
                  "bg-bubble-received text-bubble-received-text",
                  isLastInGroup ? "bubble-tail-left" : "rounded-bl-md"
                )
          )}
        >
          <p className="whitespace-pre-wrap break-words text-base leading-snug">
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

        {/* Timestamp + iOS-style status (only on last message from me) */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-text-tertiary">
            {formatMessageTime(message.created_at)}
          </span>
          {message.is_edited && (
            <span className="text-[10px] text-text-tertiary">edited</span>
          )}
          {isMine && isLastFromMe && <StatusText status={message.status} />}
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
