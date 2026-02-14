"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Use getClaims() to validate the user's JWT token
  const { data: claimsData } = await supabase.auth.getClaims();
  
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Use admin client for the INSERT since we've already validated the user
  // This bypasses RLS but is safe because we've verified the user's identity via getClaims()
  const adminClient = createAdminClient();

  const { data: conversation, error: convError } = await adminClient
    .from("conversations")
    .insert({
      type: "group",
      name,
      created_by: userId,
    })
    .select("id")
    .single();

  if (convError) {
    return { error: convError.message };
  }

  const participants = [userId, ...userIds].map((uid) => ({
    conversation_id: conversation.id,
    user_id: uid,
    role: uid === userId ? ("owner" as const) : ("member" as const),
  }));

  const { error: partError } = await adminClient
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

  const newPinnedState = !participant.is_pinned;
  
  const { error } = await supabase
    .from("conversation_participants")
    .update({ 
      is_pinned: newPinnedState,
      pinned_at: newPinnedState ? new Date().toISOString() : null
    })
    .eq("id", participant.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");

  return { isPinned: newPinnedState };
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

  const { error } = await supabase.rpc("delete_conversation_for_user", {
    p_conversation_id: conversationId,
  });

  if (error) {
    console.error("[deleteConversation] RPC error:", error);
    // Don't block UI — ghost conversations should still be cleanable
  }

  revalidatePath("/messages");

  return { success: true };
}
