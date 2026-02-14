import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { userId } = await params;
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
    .eq("id", userId)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 404 });
  }

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Apply privacy settings - hide fields the user has marked private
  // unless the viewer is the profile owner
  const isOwner = user.id === userId;
  let filteredUserProfile = userProfile;

  if (filteredUserProfile && !isOwner) {
    if (!filteredUserProfile.show_phone) {
      filteredUserProfile = {
        ...filteredUserProfile,
        phone_primary: null,
        phone_work: null,
      };
    }
    if (!filteredUserProfile.show_email) {
      filteredUserProfile = {
        ...filteredUserProfile,
        email_primary: null,
        email_work: null,
      };
    }
    if (!filteredUserProfile.show_birthday) {
      filteredUserProfile = {
        ...filteredUserProfile,
        birthday: null,
      };
    }
  }

  return NextResponse.json({ profile, userProfile: filteredUserProfile });
}
