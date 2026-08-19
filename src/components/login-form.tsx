"use client";

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
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfigured) {
      setError("portal auth is not configured.");
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
        setError(signInError.message.toLowerCase());
        return;
      }

      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="portal-login-received">
        <p>your account is being set up.</p>
        <p>you&apos;ll receive an email once everything is ready.</p>
      </div>
    );
  }

  return (
    <form className="portal-login-form" onSubmit={submit}>
      <label className="portal-login-field">
        <span>sign up</span>
        <input
          type="email"
          required
          autoComplete="email"
          autoFocus
          disabled={isPending || !isConfigured}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </label>
      <div className="portal-login-actions">
        <button type="submit" disabled={isPending || !isConfigured}>
          {isPending ? "sending" : "enter"}
        </button>
        {error ? <p className="portal-login-error">{error}</p> : null}
      </div>
    </form>
  );
}
