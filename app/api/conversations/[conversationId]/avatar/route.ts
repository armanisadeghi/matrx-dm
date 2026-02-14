import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Props = {
  params: Promise<{ conversationId: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permissions
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!participant || !["owner", "admin"].includes(participant.role)) {
    return NextResponse.json(
      { error: "You don't have permission to update this group" },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("avatar") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File must be a JPEG, PNG, WebP, or GIF image" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File must be smaller than 2MB" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `groups/${conversationId}.${ext}`;

  const { error: uploadError } = await adminClient.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = adminClient.storage
    .from("avatars")
    .getPublicUrl(filePath);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await adminClient
    .from("conversations")
    .update({ avatar_url: avatarUrl })
    .eq("id", conversationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ avatarUrl });
}
