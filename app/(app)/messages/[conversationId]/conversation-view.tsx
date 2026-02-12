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
    isConnected,
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
    <div className="relative flex h-full flex-col">
      <ConversationHeader
        name={conversationName}
        avatarUrl={avatarUrl}
        conversationId={conversationId}
        conversationType={conversationType}
        memberCount={memberCount}
        typingUsers={typingUsers}
      />

      {messages.length === 0 && !isConnected ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <MessageThread
          messages={messages}
          currentUserId={user.id}
        />
      )}

      <TypingIndicator typingUsers={typingUsers} />
      <MessageInput onSend={handleSend} onTyping={handleTyping} />

      {/* Connection status banner */}
      {!isConnected && messages.length > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 shadow-lg">
            <Spinner size="sm" />
            <span className="text-xs font-medium text-text-secondary">
              Reconnecting...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
