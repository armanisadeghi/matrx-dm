import { createClient } from "@/lib/supabase/server";
import { MessagesShell } from "./messages-shell";
import type { ConversationWithDetails } from "@/lib/types";

export default async function MessagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let conversations: ConversationWithDetails[] = [];

  if (user) {
    const { data } = await supabase.rpc("get_conversations_for_user", {
      p_user_id: user.id,
    });

    if (data) {
      conversations = data as ConversationWithDetails[];
    }
  }

  return (
    <MessagesShell initialConversations={conversations}>
      {children}
    </MessagesShell>
  );
}
