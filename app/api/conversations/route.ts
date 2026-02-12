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

  const { data, error } = await supabase.rpc("get_conversations_for_user", {
    p_user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, name, user_ids } = body as {
    type: "direct" | "group";
    name?: string;
    user_ids: string[];
  };

  if (type === "direct") {
    if (!user_ids[0]) {
      return NextResponse.json(
        { error: "user_ids must contain one user ID for direct conversations" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "get_or_create_direct_conversation",
      { p_other_user_id: user_ids[0] }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversation_id: data }, { status: 201 });
  }

  if (type === "group") {
    if (!name) {
      return NextResponse.json(
        { error: "name is required for group conversations" },
        { status: 400 }
      );
    }

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({ type: "group", name, created_by: user.id })
      .select("id")
      .single();

    if (convError) {
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    const participants = [user.id, ...user_ids].map((uid) => ({
      conversation_id: conversation.id,
      user_id: uid,
      role: uid === user.id ? "owner" : "member",
    }));

    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert(participants);

    if (partError) {
      return NextResponse.json({ error: partError.message }, { status: 500 });
    }

    return NextResponse.json(
      { conversation_id: conversation.id },
      { status: 201 }
    );
  }

  return NextResponse.json(
    { error: "type must be 'direct' or 'group'" },
    { status: 400 }
  );
}
