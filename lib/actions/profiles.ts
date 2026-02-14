"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { UpdateProfilePayload } from "@/lib/types";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function updateProfile(payload: UpdateProfilePayload) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Split payload into profiles fields and user_profiles fields
  const { display_name, avatar_url, status_text, ...userProfileFields } = payload;

  // Update base profile if needed
  const profileUpdate: Record<string, unknown> = {};
  if (display_name !== undefined) profileUpdate.display_name = display_name;
  if (avatar_url !== undefined) profileUpdate.avatar_url = avatar_url;
  if (status_text !== undefined) profileUpdate.status_text = status_text;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);

    if (error) {
      return { error: error.message };
    }
  }

  // Update user_profiles if needed
  if (Object.keys(userProfileFields).length > 0) {
    const { error } = await supabase
      .from("user_profiles")
      .update(userProfileFields)
      .eq("id", userId);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/settings/profile");
  revalidatePath("/messages");
  return { success: true };
}

export async function uploadUserAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
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
  const filePath = `users/${userId}.${ext}`;

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

  // Update the profile's avatar_url
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/settings/profile");
  revalidatePath("/messages");
  return { success: true, avatarUrl };
}

export async function getPublicProfile(userId: string) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    return { error: profileError.message, profile: null, userProfile: null };
  }

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { profile, userProfile, error: null };
}

export async function getMyProfile() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated", profile: null, userProfile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    return { error: profileError.message, profile: null, userProfile: null };
  }

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { profile, userProfile, error: null };
}
