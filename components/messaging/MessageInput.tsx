"use client";

import { cn } from "@/lib/cn";
import { IconButton } from "@/components/ui";
import { Plus, Send, Smile, X } from "lucide-react";
import { useRef, useState } from "react";

type MessageInputProps = {
  onSend: (content: string) => void;
  onTyping?: () => void;
  replyTo?: { id: string; senderName: string; content: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  className?: string;
};

export function MessageInput({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled,
  className,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue("");
    onCancelReply?.();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    onTyping?.();

    const el = e.target;
    el.style.height = "auto";
    const maxHeight = 6 * 24; // ~6 lines
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }

  const hasContent = value.trim().length > 0;

  return (
    <div className={cn("border-t border-border-subtle bg-bg-primary safe-bottom", className)}>
      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-medium text-accent">
              Replying to {replyTo.senderName}
            </span>
            <span className="truncate text-xs text-text-tertiary">
              {replyTo.content}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 rounded-full p-1 text-text-tertiary hover:text-text-primary"
            aria-label="Cancel reply"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-1 px-2 py-2">
        <IconButton icon={Plus} label="Attach file" size="sm" variant="ghost" />

        <div className="flex min-h-[36px] flex-1 items-end rounded-2xl bg-bg-input px-3 py-1.5">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            rows={1}
            disabled={disabled}
            className={cn(
              "max-h-[144px] w-full resize-none bg-transparent text-base text-text-primary",
              "placeholder:text-text-tertiary",
              "outline-none",
              "disabled:opacity-50"
            )}
          />
        </div>

        {hasContent ? (
          <IconButton
            icon={Send}
            label="Send message"
            size="sm"
            variant="solid"
            onClick={handleSubmit}
            disabled={disabled}
          />
        ) : (
          <IconButton
            icon={Smile}
            label="Emoji picker"
            size="sm"
            variant="ghost"
          />
        )}
      </div>
    </div>
  );
}
