"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase-browser";
import { ArrowRight } from "lucide-react";

export function LoginForm({
  nextPath,
  isConfigured,
}: {
  nextPath: string;
  isConfigured: boolean;
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfigured) {
      setError("Portal auth is not configured.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
          shouldCreateUser: true,
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="mt-10 space-y-2">
        <p className="text-sm text-neutral-800">Your account is being set up.</p>
        <p className="text-sm text-neutral-500">
          You&apos;ll receive an email once everything is ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10">
      <div className="relative">
        <input
          id="email"
          type="email"
          required
          disabled={isPending || !isConfigured}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          className="w-full border-b border-neutral-300 bg-transparent py-2 pr-10 text-base text-neutral-950 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-950 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !isConfigured}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-950 disabled:opacity-30"
          aria-label="Submit"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
      {error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : null}
    </form>
  );
}
