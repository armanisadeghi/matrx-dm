"use client";

import { cn } from "@/lib/cn";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useConversationList } from "@/lib/hooks/useConversationList";
import { usePresence } from "@/lib/hooks/usePresence";
import { useUser } from "../user-context";
import { ConversationsProvider } from "./conversations-context";
import type { ConversationWithDetails } from "@/lib/types";

type MessagesShellProps = {
  initialConversations: ConversationWithDetails[];
  children: React.ReactNode;
};

export function MessagesShell({
  initialConversations,
  children,
}: MessagesShellProps) {
  const user = useUser();
  const params = useParams();
  const hasActiveConversation = !!params?.conversationId;

  const { conversations, markRead, removeConversation, addConversation } =
    useConversationList(initialConversations, user.id);

  usePresence(user.id);

  return (
    <ConversationsProvider
      value={{ conversations, removeConversation, addConversation, markRead }}
    >
      <div className="flex h-dvh w-full bg-bg-primary">
        {/* Sidebar — hidden on mobile when a conversation is open */}
        <div
          className={cn(
            "shrink-0",
            hasActiveConversation ? "hidden lg:flex" : "flex",
            "w-full lg:w-auto"
          )}
        >
          <Sidebar conversations={conversations} />
        </div>

        {/* Main content area */}
        <main
          className={cn(
            "flex flex-1 flex-col",
            hasActiveConversation ? "flex" : "hidden lg:flex"
          )}
        >
          {children}
        </main>
      </div>
    </ConversationsProvider>
  );
}
