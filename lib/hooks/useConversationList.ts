"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ConversationWithDetails } from "@/lib/types";
import type { Tables } from "@/lib/types/database";

type MessageRow = Tables<"messages">;

export function useConversationList(
  initialData: ConversationWithDetails[],
  currentUserId: string | null
) {
  const [conversations, setConversations] =
    useState<ConversationWithDetails[]>(initialData);

  useEffect(() => {
    setConversations(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();

    const channel = supabase
      .channel("conversation-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as MessageRow;

          setConversations((prev) => {
            const idx = prev.findIndex(
              (c) => c.conversation_id === msg.conversation_id
            );

            if (idx === -1) return prev;

            const updated = [...prev];
            const conv = { ...updated[idx]! };
            conv.last_message_id = msg.id;
            conv.last_message_content = msg.content;
            conv.last_message_created_at = msg.created_at;
            conv.last_message_sender_id = msg.sender_id;
            conv.last_message_type = msg.type;
            conv.conversation_updated_at = msg.created_at;

            if (msg.sender_id !== currentUserId) {
              conv.unread_count = conv.unread_count + 1;
            }

            updated.splice(idx, 1);
            updated.unshift(conv);

            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const markRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c
      )
    );
  }, []);

  const removeConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.filter((c) => c.conversation_id !== conversationId)
    );
  }, []);

  const addConversation = useCallback((conversation: ConversationWithDetails) => {
    setConversations((prev) => {
      // Don't add duplicates
      if (prev.some((c) => c.conversation_id === conversation.conversation_id)) {
        return prev;
      }
      return [conversation, ...prev];
    });
  }, []);

  return { conversations, markRead, removeConversation, addConversation };
}
