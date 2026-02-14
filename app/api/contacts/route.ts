import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First get contacts with their profiles
  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*, profile:profiles!contacts_contact_user_id_fkey(*)")
    .eq("owner_id", user.id)
    .order("is_favorite", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Then get user_profiles for all contact users
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

  const enriched = (contacts ?? []).map((c) => ({
    ...c,
    user_profile: userProfilesMap[c.contact_user_id] ?? null,
  }));

  return NextResponse.json({ contacts: enriched });
}
