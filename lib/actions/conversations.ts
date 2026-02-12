"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDirectConversation(otherUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    p_other_user_id: otherUserId,
  });

  if (error) {
    console.error("[createDirectConversation] RPC error:", error);
    return { error: error.message };
  }

  if (!data) {
    console.error("[createDirectConversation] RPC returned null");
    return { error: "Failed to create conversation" };
  }

  revalidatePath("/messages");

  return { conversationId: data as string };
}

export async function createGroupConversation(name: string, userIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      type: "group",
      name,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (convError) {
    return { error: convError.message };
  }

  const participants = [user.id, ...userIds].map((uid) => ({
    conversation_id: conversation.id,
    user_id: uid,
    role: uid === user.id ? "owner" : "member",
  }));

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert(participants);

  if (partError) {
    return { error: partError.message };
  }

  revalidatePath("/messages");

  return { conversationId: conversation.id };
}

export async function markConversationRead(
  conversationId: string,
  messageId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
    p_message_id: messageId,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function togglePin(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: participant, error: fetchErr } = await supabase
    .from("conversation_participants")
    .select("id, is_pinned")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !participant) {
    return { error: fetchErr?.message ?? "Participant not found" };
  }

  const { error } = await supabase
    .from("conversation_participants")
    .update({ is_pinned: !participant.is_pinned })
    .eq("id", participant.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");

  return { isPinned: !participant.is_pinned };
}

export async function toggleMute(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: participant, error: fetchErr } = await supabase
    .from("conversation_participants")
    .select("id, is_muted")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !participant) {
    return { error: fetchErr?.message ?? "Participant not found" };
  }

  const { error } = await supabase
    .from("conversation_participants")
    .update({ is_muted: !participant.is_muted })
    .eq("id", participant.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");

  return { isMuted: !participant.is_muted };
}

export async function deleteConversation(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("conversation_participants")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");

  return { success: true };
}
