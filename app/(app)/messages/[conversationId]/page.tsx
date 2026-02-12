import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ConversationView } from "./conversation-view";

type Props = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!participant) notFound();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();

  let displayName = conversation.name ?? "Conversation";
  let avatarUrl = conversation.avatar_url;

  if (conversation.type === "direct") {
    const { data: otherParticipants } = await supabase
      .from("conversation_participants")
      .select("user_id, profiles:profiles!conversation_participants_user_id_fkey(display_name, avatar_url)")
      .eq("conversation_id", conversationId)
      .neq("user_id", user.id);

    if (otherParticipants?.[0]) {
      const other = otherParticipants[0].profiles as unknown as {
        display_name: string;
        avatar_url: string | null;
      };
      if (other) {
        displayName = other.display_name;
        avatarUrl = other.avatar_url;
      }
    }
  }

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
