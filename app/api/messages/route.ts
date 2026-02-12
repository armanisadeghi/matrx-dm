import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { conversation_id, content, type, reply_to_id } = body as {
    conversation_id: string;
    content: string;
    type?: string;
    reply_to_id?: string;
  };

  if (!conversation_id || !content) {
    return NextResponse.json(
      { error: "conversation_id and content are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      sender_id: user.id,
      content,
      type: type ?? "text",
      reply_to_id: reply_to_id ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversation_id);

  return NextResponse.json({ data }, { status: 201 });
}
