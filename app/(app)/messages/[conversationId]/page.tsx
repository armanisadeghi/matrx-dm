import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConversationView } from "./conversation-view";
import { ConversationNotFound } from "./conversation-not-found";

type Props = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Validate UUID format before querying
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(conversationId)) {
    return <ConversationNotFound reason="invalid" conversationId={conversationId} />;
  }

  // Fetch participant and conversation data in parallel
  const [participantResult, conversationResult] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single(),
  ]);

  const { data: participant } = participantResult;
  const { data: conversation } = conversationResult;

  // Check access and existence
  if (!participant) {
    if (conversation) {
      return <ConversationNotFound reason="no-access" conversationId={conversationId} />;
    }
    return <ConversationNotFound reason="not-found" conversationId={conversationId} />;
  }

  if (!conversation) {
    return <ConversationNotFound reason="not-found" conversationId={conversationId} />;
  }

  let displayName = conversation.name ?? "Conversation";
  let avatarUrl = conversation.avatar_url;

  // Fetch member count and other participant data in parallel
  if (conversation.type === "direct") {
    const [memberCountResult, otherParticipantResult] = await Promise.all([
      supabase
        .from("conversation_participants")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversationId),
      supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id),
    ]);

    const { count: memberCount } = memberCountResult;
    const otherUserId = otherParticipantResult.data?.[0]?.user_id;

    if (otherUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", otherUserId)
        .single();

      if (profile) {
        displayName = profile.display_name;
        avatarUrl = profile.avatar_url;
      }
    }

    return (
      <ConversationView
        conversationId={conversationId}
        conversationName={displayName}
        conversationType={conversation.type}
        avatarUrl={avatarUrl}
        memberCount={memberCount ?? 0}
      />
    );
  }

  // For group conversations, just fetch member count
  const { count: memberCount } = await supabase
    .from("conversation_participants")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId);

  return (
    <ConversationView
      conversationId={conversationId}
      conversationName={displayName}
      conversationType={conversation.type}
      avatarUrl={avatarUrl}
      memberCount={memberCount ?? 0}
    />
  );
}
