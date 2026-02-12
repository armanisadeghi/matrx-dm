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

  if (!query || query.length < 1) {
    return NextResponse.json({ data: [] });
  }

  // Search profiles by display_name, excluding the current user
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, is_online, status_text")
    .neq("id", user.id)
    .ilike("display_name", `%${query}%`)
    .order("display_name")
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
