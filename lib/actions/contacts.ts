"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UpdateContactPayload, ContactWithProfile } from "@/lib/types";

export async function getContacts(): Promise<{
  contacts: ContactWithProfile[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { contacts: [], error: "Not authenticated" };
  }

  // Fetch contacts with profiles
  const { data, error } = await supabase
    .from("contacts")
    .select("*, profile:profiles!contacts_contact_user_id_fkey(*)")
    .eq("owner_id", userId)
    .order("is_favorite", { ascending: false });

  if (error) {
    return { contacts: [], error: error.message };
  }

  // Separately fetch user_profiles for all contact users
  const contactUserIds = (data ?? []).map((c) => c.contact_user_id);
  let userProfilesMap: Record<string, unknown> = {};

  if (contactUserIds.length > 0) {
    const { data: userProfiles } = await supabase
      .from("user_profiles")
      .select("*")
      .in("id", contactUserIds);

    if (userProfiles) {
      userProfilesMap = Object.fromEntries(
        userProfiles.map((up) => [up.id, up])
      );
    }
  }

  const contacts = (data ?? []).map((c) => ({
    ...c,
    user_profile: userProfilesMap[c.contact_user_id] ?? null,
  })) as unknown as ContactWithProfile[];

  return { contacts, error: null };
}

export async function getContact(contactUserId: string): Promise<{
  contact: ContactWithProfile | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { contact: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("*, profile:profiles!contacts_contact_user_id_fkey(*)")
    .eq("owner_id", userId)
    .eq("contact_user_id", contactUserId)
    .single();

  if (error) {
    return { contact: null, error: error.message };
  }

  // Fetch user_profile separately
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", contactUserId)
    .single();

  const contact = {
    ...data,
    user_profile: userProfile,
  } as ContactWithProfile;

  return { contact, error: null };
}

export async function upsertContact(
  contactUserId: string,
  payload: UpdateContactPayload
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Check if contact exists
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("owner_id", userId)
    .eq("contact_user_id", contactUserId)
    .single();

  if (existing) {
    // Update
    const { error } = await supabase
      .from("contacts")
      .update(payload)
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    // Insert
    const { error } = await supabase
      .from("contacts")
      .insert({
        owner_id: userId,
        contact_user_id: contactUserId,
        ...payload,
      });

    if (error) return { error: error.message };
  }

  revalidatePath("/contacts");
  return { success: true };
}

export async function deleteContact(contactUserId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("owner_id", userId)
    .eq("contact_user_id", contactUserId);

  if (error) return { error: error.message };

  revalidatePath("/contacts");
  return { success: true };
}

export async function toggleFavorite(contactUserId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // Get current state
  const { data: contact, error: fetchError } = await supabase
    .from("contacts")
    .select("id, is_favorite")
    .eq("owner_id", userId)
    .eq("contact_user_id", contactUserId)
    .single();

  if (fetchError || !contact) {
    // If no contact exists, create one with favorite set to true
    const { error } = await supabase
      .from("contacts")
      .insert({
        owner_id: userId,
        contact_user_id: contactUserId,
        is_favorite: true,
      });

    if (error) return { error: error.message };
    revalidatePath("/contacts");
    return { success: true, is_favorite: true };
  }

  // Toggle
  const newValue = !contact.is_favorite;
  const { error } = await supabase
    .from("contacts")
    .update({ is_favorite: newValue })
    .eq("id", contact.id);

  if (error) return { error: error.message };

  revalidatePath("/contacts");
  return { success: true, is_favorite: newValue };
}
