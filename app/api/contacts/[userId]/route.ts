import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { userId: contactUserId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*, profile:profiles!contacts_contact_user_id_fkey(*)")
    .eq("owner_id", user.id)
    .eq("contact_user_id", contactUserId)
    .single();

  if (error) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", contactUserId)
    .single();

  return NextResponse.json({
    contact: { ...contact, user_profile: userProfile },
  });
}

export async function PUT(request: Request, { params }: Props) {
  const { userId: contactUserId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Check if contact exists
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("owner_id", user.id)
    .eq("contact_user_id", contactUserId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("contacts")
      .update(body)
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("contacts").insert({
      owner_id: user.id,
      contact_user_id: contactUserId,
      ...body,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: Props) {
  const { userId: contactUserId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("owner_id", user.id)
    .eq("contact_user_id", contactUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
