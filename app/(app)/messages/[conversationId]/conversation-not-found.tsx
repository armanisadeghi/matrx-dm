"use client";

import { cn } from "@/lib/cn";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircleOff,
  ArrowLeft,
  PenSquare,
  Search,
  ShieldAlert,
  CircleAlert,
  Trash2,
} from "lucide-react";
import { Spinner } from "@/components/ui";
import { deleteConversation } from "@/lib/actions/conversations";
import { useConversations } from "../conversations-context";

type Reason = "not-found" | "no-access" | "invalid";

type ConversationNotFoundProps = {
  reason: Reason;
  conversationId?: string;
};

const content: Record<
  Reason,
  {
    icon: typeof MessageCircleOff;
    title: string;
    description: string;
  }
> = {
  "not-found": {
    icon: MessageCircleOff,
    title: "Conversation not found",
    description:
      "This conversation may have been deleted or the link is no longer valid.",
  },
  "no-access": {
    icon: ShieldAlert,
    title: "You don\u2019t have access",
    description:
      "You\u2019re not a participant in this conversation. Ask someone to add you, or start a new one.",
  },
  invalid: {
    icon: CircleAlert,
    title: "Invalid conversation link",
    description:
      "This doesn\u2019t look like a valid conversation. Check the URL and try again.",
  },
};

export function ConversationNotFound({
  reason,
  conversationId,
}: ConversationNotFoundProps) {
  const router = useRouter();
  const { removeConversation } = useConversations();
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const { icon: Icon, title, description } = content[reason];

  async function handleDelete() {
    if (!conversationId || deleting) return;
    setDeleting(true);

    // Optimistic: remove from sidebar immediately
    removeConversation(conversationId);

    // Fire-and-forget server cleanup
    deleteConversation(conversationId);

    setDeleted(true);
    setTimeout(() => {
      router.replace("/messages");
    }, 600);
  }

  if (deleted) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <div className="flex max-w-sm flex-col items-center text-center">
          <div
            className={cn(
              "mb-6 flex h-20 w-20 items-center justify-center rounded-full",
              "bg-green-500/10"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-text-primary">Removed</h1>
          <p className="mt-2 text-sm text-text-tertiary">
            Taking you back to messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        {/* Icon */}
        <div
          className={cn(
            "mb-6 flex h-20 w-20 items-center justify-center rounded-full",
            "bg-bg-tertiary/60"
          )}
        >
          <Icon size={36} strokeWidth={1.5} className="text-text-tertiary" />
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>

        {/* Description */}
        <p className="mt-2 text-sm leading-relaxed text-text-tertiary">
          {description}
        </p>

        {/* Actions */}
        <div className="mt-8 flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              router.replace("/messages");
              router.refresh();
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl",
              "bg-accent px-5 py-3",
              "text-sm font-medium text-white",
              "transition-colors duration-[var(--duration-fast)]",
              "hover:bg-accent-hover active:scale-[0.98]",
              "active:transition-transform"
            )}
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Back to Messages
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                router.replace("/messages");
                setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent("open-new-conversation")
                  );
                }, 200);
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl",
                "bg-bg-tertiary/60 px-4 py-3",
                "text-sm font-medium text-text-primary",
                "transition-colors duration-[var(--duration-fast)]",
                "hover:bg-bg-tertiary active:scale-[0.98]",
                "active:transition-transform"
              )}
            >
              <PenSquare size={16} strokeWidth={1.5} />
              New Chat
            </button>

            <button
              type="button"
              onClick={() => {
                router.replace("/messages");
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("focus-search"));
                }, 200);
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl",
                "bg-bg-tertiary/60 px-4 py-3",
                "text-sm font-medium text-text-primary",
                "transition-colors duration-[var(--duration-fast)]",
                "hover:bg-bg-tertiary active:scale-[0.98]",
                "active:transition-transform"
              )}
            >
              <Search size={16} strokeWidth={1.5} />
              Search
            </button>
          </div>

          {/* Remove / clean up broken conversation */}
          {conversationId && reason === "not-found" && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl",
                "px-4 py-3",
                "text-sm font-medium text-destructive",
                "transition-colors duration-[var(--duration-fast)]",
                "hover:bg-destructive/10 active:scale-[0.98]",
                "active:transition-transform",
                "disabled:opacity-50"
              )}
            >
              {deleting ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Trash2 size={16} strokeWidth={1.5} />
                  Remove from Conversations
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
