import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { userId: contactUserId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current state
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, is_favorite")
    .eq("owner_id", user.id)
    .eq("contact_user_id", contactUserId)
    .single();

  if (!contact) {
    // Create contact with favorite=true
    const { error } = await supabase.from("contacts").insert({
      owner_id: user.id,
      contact_user_id: contactUserId,
      is_favorite: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ is_favorite: true });
  }

  // Toggle
  const newValue = !contact.is_favorite;
  const { error } = await supabase
    .from("contacts")
    .update({ is_favorite: newValue })
    .eq("id", contact.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ is_favorite: newValue });
}
