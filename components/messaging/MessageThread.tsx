"use client";

import { cn } from "@/lib/cn";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useEffect, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { formatDateSeparator, isSameDay } from "@/lib/utils/format";
import { ChevronDown } from "lucide-react";
import type { MessageWithSender } from "@/lib/types";

type MessageThreadProps = {
  messages: MessageWithSender[];
  currentUserId: string;
  onRetry?: (optimisticId: string) => void;
  onContextMenu?: (message: MessageWithSender, e: React.MouseEvent) => void;
  className?: string;
};

type ThreadItem =
  | { type: "date-separator"; date: string; key: string }
  | {
      type: "message";
      message: MessageWithSender;
      isLastInGroup: boolean;
      isLastFromMe: boolean;
      key: string;
    };

function buildThreadItems(
  messages: MessageWithSender[],
  currentUserId: string
): ThreadItem[] {
  const items: ThreadItem[] = [];

  // Pre-compute the index of the last message from the current user
  let lastMyMsgIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.sender_id === currentUserId) {
      lastMyMsgIdx = i;
      break;
    }
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]!;
    const prevMsg = i > 0 ? messages[i - 1]! : null;
    const nextMsg = i < messages.length - 1 ? messages[i + 1]! : null;

    if (!prevMsg || !isSameDay(prevMsg.created_at, msg.created_at)) {
      items.push({
        type: "date-separator",
        date: msg.created_at,
        key: `date-${msg.created_at}`,
      });
    }

    const isMine = msg.sender_id === currentUserId;

    // Last in group: next message is from a different sender, or is a different day, or doesn't exist
    const isLastInGroup =
      !nextMsg ||
      nextMsg.sender_id !== msg.sender_id ||
      !isSameDay(msg.created_at, nextMsg.created_at);

    items.push({
      type: "message",
      message: msg,
      isLastInGroup,
      isLastFromMe: isMine && i === lastMyMsgIdx,
      key: msg.optimistic_id ?? msg.id,
    });
  }

  return items;
}

export function MessageThread({
  messages,
  currentUserId,
  onRetry,
  onContextMenu,
  className,
}: MessageThreadProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const items = buildThreadItems(messages, currentUserId);
  const lastCountRef = useRef(messages.length);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = items[index];
      if (!item) return 48;
      return item.type === "date-separator" ? 40 : 56;
    },
    overscan: 10,
  });

  useEffect(() => {
    if (messages.length > lastCountRef.current) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(items.length - 1, { align: "end" });
      });
    }
    lastCountRef.current = messages.length;
  }, [messages.length, items.length, virtualizer]);

  useEffect(() => {
    if (items.length > 0) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(items.length - 1, { align: "end" });
      });
    }
  }, []);

  function handleScroll() {
    const el = parentRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distFromBottom > 200);
  }

  function scrollToBottom() {
    virtualizer.scrollToIndex(items.length - 1, { align: "end" });
  }

  return (
    <div className={cn("relative flex-1 overflow-hidden", className)}>
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide"
      >
        <div
          style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            if (!item) return null;

            return (
              <div
                key={item.key}
                ref={virtualizer.measureElement}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {item.type === "date-separator" ? (
                  <div className="flex items-center justify-center py-3">
                    <span className="rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-tertiary">
                      {formatDateSeparator(item.date)}
                    </span>
                  </div>
                ) : (
                  <div className="py-0.5">
                    <MessageBubble
                      message={item.message}
                      isMine={item.message.sender_id === currentUserId}
                      isLastInGroup={item.isLastInGroup}
                      isLastFromMe={item.isLastFromMe}
                      onContextMenu={
                        onContextMenu
                          ? (e) => onContextMenu(item.message, e)
                          : undefined
                      }
                      onRetry={
                        item.message.status === "failed" && item.message.optimistic_id && onRetry
                          ? () => onRetry(item.message.optimistic_id!)
                          : undefined
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2",
            "flex items-center gap-1 rounded-full px-3 py-1.5",
            "glass text-sm font-medium text-text-primary",
            "animate-fade-in cursor-pointer",
            "shadow-lg"
          )}
        >
          <ChevronDown size={16} strokeWidth={1.5} />
          New messages
        </button>
      )}
    </div>
  );
}
