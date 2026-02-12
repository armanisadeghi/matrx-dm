"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SendMessagePayload } from "@/lib/types";

export async function sendMessage(payload: SendMessagePayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: payload.conversation_id,
      sender_id: user.id,
      content: payload.content,
      type: payload.type ?? "text",
      reply_to_id: payload.reply_to_id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", payload.conversation_id);

  revalidatePath("/messages");

  return { data };
}

export async function editMessage(messageId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("messages")
    .update({
      content,
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("messages")
    .update({
      is_deleted: true,
      content: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
