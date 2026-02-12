"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Show errors passed via query params (e.g. from OAuth flow)
  const queryError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const displayError = error ?? queryError;

  return (
    <div className="space-y-6">
      {/* AI Matrx OAuth button */}
      <a
        href="/api/auth/aimatrx"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-bg-secondary px-4 py-2.5 text-base font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Continue with AI Matrx
      </a>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-subtle" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-bg-primary px-2 text-text-tertiary">
            or continue with email
          </span>
        </div>
      </div>

      {/* Email / password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-secondary"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="block w-full rounded-lg border border-border-subtle bg-bg-input px-3 py-2.5 text-base text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-secondary"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="block w-full rounded-lg border border-border-subtle bg-bg-input px-3 py-2.5 text-base text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Your password"
          />
        </div>

        {displayError && (
          <p className="text-sm text-destructive">{displayError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading
            ? "Loading..."
            : mode === "login"
              ? "Sign In"
              : "Sign Up"}
        </button>

        <p className="text-center text-sm text-text-secondary">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-accent hover:text-accent-hover"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </form>
    </div>
  );
}
