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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ profile, userProfile });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { display_name, avatar_url, status_text, ...userProfileFields } = body;

  // Update base profile fields
  const profileUpdate: Record<string, unknown> = {};
  if (display_name !== undefined) profileUpdate.display_name = display_name;
  if (avatar_url !== undefined) profileUpdate.avatar_url = avatar_url;
  if (status_text !== undefined) profileUpdate.status_text = status_text;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Update extended profile fields
  if (Object.keys(userProfileFields).length > 0) {
    const { error } = await supabase
      .from("user_profiles")
      .update(userProfileFields)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
