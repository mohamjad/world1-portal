"use client";

import { Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase-browser";

export function LoginForm({
  nextPath,
  isConfigured,
}: {
  nextPath: string;
  isConfigured: boolean;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfigured) {
      setError("Portal auth is not configured.");
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(
            nextPath,
          )}`,
          shouldCreateUser: true,
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setMessage("Check your email for the login link.");
    });
  }

  return (
    <div className="mt-8 space-y-4">
      <button
        type="button"
        onClick={() => {
          if (!isConfigured) {
            setError("Portal auth is not configured.");
            return;
          }

          const supabase = createClient();
          const origin = window.location.origin;
          void supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(
                nextPath,
              )}`,
            },
          });
        }}
        disabled={!isConfigured}
        className="flex h-11 w-full items-center justify-center gap-2 border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-neutral-500">
        <span className="h-px flex-1 bg-neutral-200" />
        Email
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
          required
          disabled={!isConfigured}
          value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full border border-neutral-300 bg-white px-3 text-base outline-none focus:border-neutral-950"
            autoComplete="email"
          />
        </div>
        <button
          type="submit"
        disabled={isPending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 bg-neutral-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Sending" : "Send login link"}
        </button>
      </form>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {!isConfigured ? (
        <p className="text-sm text-red-700">
          Missing Supabase environment variables.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
