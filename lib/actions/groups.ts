"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function updateGroupAvatar(conversationId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin or owner
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!participant || !["owner", "admin"].includes(participant.role)) {
    return { error: "You don't have permission to update this group" };
  }

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: "File must be a JPEG, PNG, WebP, or GIF image" };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { error: "File must be smaller than 2MB" };
  }

  const adminClient = createAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `groups/${conversationId}.${ext}`;

  const { error: uploadError } = await adminClient.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: urlData } = adminClient.storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await adminClient
    .from("conversations")
    .update({ avatar_url: avatarUrl })
    .eq("id", conversationId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/messages");
  return { success: true, avatarUrl };
}

export async function updateGroupName(conversationId: string, name: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin or owner
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!participant || !["owner", "admin"].includes(participant.role)) {
    return { error: "You don't have permission to update this group" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("conversations")
    .update({ name })
    .eq("id", conversationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");
  return { success: true };
}

export async function addGroupMembers(conversationId: string, userIds: string[]) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin or owner
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!participant || !["owner", "admin"].includes(participant.role)) {
    return { error: "You don't have permission to add members" };
  }

  const adminClient = createAdminClient();
  const participants = userIds.map((uid) => ({
    conversation_id: conversationId,
    user_id: uid,
    role: "member" as const,
  }));

  const { error } = await adminClient
    .from("conversation_participants")
    .insert(participants);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");
  return { success: true };
}

export async function removeGroupMember(conversationId: string, memberUserId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin or owner
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!participant || !["owner", "admin"].includes(participant.role)) {
    return { error: "You don't have permission to remove members" };
  }

  // Check if target user is the owner
  const { data: targetParticipant } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", memberUserId)
    .single();

  if (targetParticipant?.role === "owner") {
    return { error: "Cannot remove the group owner" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("conversation_participants")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", memberUserId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");
  return { success: true };
}

export async function updateMemberRole(
  conversationId: string,
  memberUserId: string,
  newRole: "admin" | "member"
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Only owner can change roles
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!participant || participant.role !== "owner") {
    return { error: "Only the group owner can change member roles" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("conversation_participants")
    .update({ role: newRole })
    .eq("conversation_id", conversationId)
    .eq("user_id", memberUserId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");
  return { success: true };
}

export async function leaveGroup(conversationId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Check if user is the owner
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  if (participant?.role === "owner") {
    return { error: "Group owner cannot leave. Transfer ownership or delete the group." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("conversation_participants")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");
  return { success: true };
}

export async function deleteGroup(conversationId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Only owner can delete
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!participant || participant.role !== "owner") {
    return { error: "Only the group owner can delete the group" };
  }

  const adminClient = createAdminClient();
  
  // Delete conversation (cascade will handle participants and messages)
  const { error } = await adminClient
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");
  return { success: true };
}
