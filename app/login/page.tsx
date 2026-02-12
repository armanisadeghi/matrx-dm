import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-primary">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-text-primary">
            Matrx DM
          </h1>
          <p className="text-sm text-text-secondary">
            Sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
