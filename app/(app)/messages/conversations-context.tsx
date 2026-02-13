"use client";

import { createContext, useContext } from "react";
import type { ConversationWithDetails } from "@/lib/types";

type ConversationsContextValue = {
  conversations: ConversationWithDetails[];
  removeConversation: (conversationId: string) => void;
  addConversation: (conversation: ConversationWithDetails) => void;
  markRead: (conversationId: string) => void;
};

const ConversationsContext = createContext<ConversationsContextValue | null>(
  null
);

export function ConversationsProvider({
  value,
  children,
}: {
  value: ConversationsContextValue;
  children: React.ReactNode;
}) {
  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations(): ConversationsContextValue {
  const ctx = useContext(ConversationsContext);
  if (!ctx) {
    throw new Error(
      "useConversations must be used within a ConversationsProvider"
    );
  }
  return ctx;
}
