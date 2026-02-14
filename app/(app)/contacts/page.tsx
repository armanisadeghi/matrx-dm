import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ContactList } from "@/components/contacts/ContactList";
import type { ContactWithProfile } from "@/lib/types";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all contacts with profiles
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*, profile:profiles!contacts_contact_user_id_fkey(*)")
    .eq("owner_id", user.id)
    .order("is_favorite", { ascending: false });

  // Get user profiles for enrichment
  const contactUserIds = (contacts ?? []).map((c) => c.contact_user_id);
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

  const enrichedContacts = (contacts ?? []).map((c) => ({
    ...c,
    user_profile: userProfilesMap[c.contact_user_id] ?? null,
  })) as ContactWithProfile[];

  // Also fetch all users the person has had conversations with
  // to show as "add to contacts" suggestions
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const convIds = (participants ?? []).map((p) => p.conversation_id);
  let conversationUsers: Array<{ id: string; display_name: string; avatar_url: string | null; is_online: boolean }> = [];

  if (convIds.length > 0) {
    const { data: otherParticipants } = await supabase
      .from("conversation_participants")
      .select("user_id, profile:profiles!conversation_participants_user_id_fkey(id, display_name, avatar_url, is_online)")
      .in("conversation_id", convIds)
      .neq("user_id", user.id);

    if (otherParticipants) {
      const seen = new Set<string>();
      const existingContactIds = new Set(contactUserIds);
      conversationUsers = otherParticipants
        .filter((p) => {
          const profile = p.profile as unknown as { id: string };
          if (seen.has(profile.id) || existingContactIds.has(profile.id)) return false;
          seen.add(profile.id);
          return true;
        })
        .map((p) => p.profile as unknown as { id: string; display_name: string; avatar_url: string | null; is_online: boolean });
    }
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-bg-secondary safe-top">
      <ContactList
        contacts={enrichedContacts}
        suggestions={conversationUsers}
      />
    </div>
  );
}
