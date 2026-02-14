import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { conversationId } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: members, error } = await supabase
    .from("conversation_participants")
    .select("*, profile:profiles!conversation_participants_user_id_fkey(*)")
    .eq("conversation_id", conversationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members });
}
