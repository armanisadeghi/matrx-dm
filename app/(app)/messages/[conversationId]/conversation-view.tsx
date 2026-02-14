"use client";

import { useEffect } from "react";
import { ConversationHeader } from "@/components/messaging/ConversationHeader";
import { MessageThread } from "@/components/messaging/MessageThread";
import { MessageInput } from "@/components/messaging/MessageInput";
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages";
import { useTypingIndicator } from "@/lib/hooks/useTypingIndicator";
import { sendMessage } from "@/lib/actions/messages";
import { markConversationRead } from "@/lib/actions/conversations";
import { useUser } from "../../user-context";
import { Spinner } from "@/components/ui";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import type { MessageWithSender } from "@/lib/types";

type ConversationViewProps = {
  conversationId: string;
  conversationName: string;
  conversationType: string;
  avatarUrl: string | null;
  memberCount: number;
};

export function ConversationView({
  conversationId,
  conversationName,
  conversationType,
  avatarUrl,
  memberCount,
}: ConversationViewProps) {
  const user = useUser();
  const {
    messages,
    connectionState,
    isFetched,
    addOptimistic,
    reconcile,
    failOptimistic,
  } = useRealtimeMessages(conversationId);

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    conversationId,
    user.id
  );

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]!;
      if (lastMsg.sender_id !== user.id) {
        markConversationRead(conversationId, lastMsg.id);
      }
    }
  }, [messages.length, conversationId, user.id]);

  async function handleSend(content: string) {
    const optimisticId = crypto.randomUUID();
    const optimisticMsg: MessageWithSender = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      type: "text",
      reply_to_id: null,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: user.profile,
      reactions: [],
      attachments: [],
      reply_to: null,
      status: "sending",
      optimistic_id: optimisticId,
    };

    addOptimistic(optimisticMsg);
    stopTyping();

    const result = await sendMessage({
      conversation_id: conversationId,
      content,
    });

    if (result.error) {
      failOptimistic(optimisticId);
    } else if (result.data) {
      reconcile(optimisticId, result.data.id);
    }
  }

  function handleTyping() {
    startTyping(user.profile.display_name);
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Message area - only this section shows loading state */}
      {!isFetched ? (
        /* Loading messages for the first time */
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-text-tertiary">Loading messages...</p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        /* Empty conversation — ready for the first message */
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-tertiary/60">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-text-tertiary"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm text-text-tertiary">
            No messages yet. Say hello!
          </p>
        </div>
      ) : (
        /* Messages loaded - show thread */
        <MessageThread
          messages={messages}
          currentUserId={user.id}
          className="pt-20 pb-16"
        />
      )}

      {/* Floating overlay layer — pointer-events-none so messages scroll through */}
      {/* These are ALWAYS visible, regardless of message loading state */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Header — fades from bg to transparent */}
        <ConversationHeader
          name={conversationName}
          avatarUrl={avatarUrl}
          conversationId={conversationId}
          conversationType={conversationType}
          memberCount={memberCount}
          typingUsers={typingUsers}
        />

        {/* Typing indicator */}
        <div className="pointer-events-auto absolute inset-x-0 bottom-14 z-20">
          <TypingIndicator typingUsers={typingUsers} />
        </div>

        {/* Input — fades from bg to transparent */}
        <MessageInput onSend={handleSend} onTyping={handleTyping} />
      </div>

      {/* Connection status banner - only show after delay and retry attempts */}
      {connectionState === "reconnecting" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 shadow-lg">
            <Spinner size="sm" />
            <span className="text-xs font-medium text-text-secondary">
              Reconnecting...
            </span>
          </div>
        </div>
      )}
      {connectionState === "failed" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 shadow-lg border border-red-500/20">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-xs font-medium text-red-500">
              Connection lost. Please refresh.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
