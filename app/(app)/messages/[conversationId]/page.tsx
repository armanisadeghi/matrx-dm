"use client";

import { use, useEffect, useState } from "react";
import { ConversationView } from "./conversation-view";
import { ConversationNotFound } from "./conversation-not-found";
import { useConversations } from "../conversations-context";
import { createClient } from "@/lib/supabase/client";

type Props = {
  params: Promise<{ conversationId: string }>;
};

export default function ConversationPage({ params }: Props) {
  const { conversationId } = use(params);
  const { conversations } = useConversations();
  const [memberCount, setMemberCount] = useState<number>(2);
  
  // Find conversation in the already-loaded list
  const conversation = conversations.find(
    (c) => c.conversation_id === conversationId
  );

  // Fetch member count in the background (non-blocking)
  useEffect(() => {
    const fetchMemberCount = async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from("conversation_participants")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversationId);
      
      if (count !== null) {
        setMemberCount(count);
      }
    };

    fetchMemberCount();
  }, [conversationId]);

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(conversationId)) {
    return <ConversationNotFound reason="invalid" conversationId={conversationId} />;
  }

  // If conversation not found in the list, show not found
  if (!conversation) {
    return <ConversationNotFound reason="not-found" conversationId={conversationId} />;
  }

  return (
    <ConversationView
      conversationId={conversationId}
      conversationName={conversation.conversation_name}
      conversationType={conversation.conversation_type}
      avatarUrl={conversation.conversation_avatar_url}
      memberCount={memberCount}
    />
  );
}
