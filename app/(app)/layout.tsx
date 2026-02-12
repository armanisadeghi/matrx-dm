import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "./user-context";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  return (
    <UserProvider
      user={{
        id: data.user.id,
        email: data.user.email ?? "",
        profile: profile ?? {
          id: data.user.id,
          display_name: data.user.email?.split("@")[0] ?? "User",
          avatar_url: null,
          status_text: null,
          is_online: true,
          last_seen_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }}
    >
      {children}
    </UserProvider>
  );
}
