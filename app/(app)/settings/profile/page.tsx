import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/ProfileForm";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 safe-top">
      <div className="mb-8 sm:hidden">
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-6">
        Edit Profile
      </h2>
      <ProfileForm profile={profile} userProfile={userProfile} />
    </div>
  );
}
