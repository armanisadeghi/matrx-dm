import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui";
import { Divider } from "@/components/ui";
import type { Profile } from "@/lib/types";

type Props = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationInfoPage({ params }: Props) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select(
      "*, profile:profiles!conversation_participants_user_id_fkey(*)"
    )
    .eq("conversation_id", conversationId);

  const members = (participants ?? [])
    .map((p) => p.profile as unknown as Profile)
    .filter(Boolean);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-bg-primary">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
        <Avatar
          src={conversation.avatar_url}
          displayName={conversation.name ?? "Conversation"}
          userId={conversation.id}
          size="lg"
        />
        <div className="text-center">
          <h1 className="text-lg font-semibold text-text-primary">
            {conversation.name ?? "Direct Message"}
          </h1>
          <p className="text-sm text-text-secondary">
            {conversation.type === "group"
              ? `${members.length} members`
              : "Direct message"}
          </p>
        </div>
      </div>

      <Divider className="mx-4" />

      {/* Members section */}
      <div className="px-4 py-4">
        <h2 className="mb-3 text-sm font-medium text-text-secondary">
          Members
        </h2>
        <div className="flex flex-col gap-1">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2"
            >
              <Avatar
                src={member.avatar_url}
                displayName={member.display_name}
                userId={member.id}
                size="sm"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">
                  {member.display_name}
                </span>
                {member.status_text && (
                  <span className="text-xs text-text-tertiary">
                    {member.status_text}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
