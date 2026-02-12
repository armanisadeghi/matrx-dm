import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  // Build the base query — always exclude the current user
  let profileQuery = supabase
    .from("profiles")
    .select("id, display_name, avatar_url, is_online, status_text")
    .neq("id", user.id);

  if (query && query.length > 0) {
    // Filter by display_name when a search term is provided
    profileQuery = profileQuery.ilike("display_name", `%${query}%`);
  }

  // When no query, return all users sorted by display_name (browse contacts)
  const { data, error } = await profileQuery
    .order("display_name")
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
