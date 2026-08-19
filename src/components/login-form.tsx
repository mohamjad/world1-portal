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
        className="h-11 w-full border border-neutral-300 bg-white px-4 text-sm font-medium hover:border-neutral-950"
      >
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
