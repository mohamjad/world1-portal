import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginFish } from "@/components/login-fish";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/";

  return (
    <main className="portal-login-page" aria-label="portal sign up">
      <LoginFish />
      <section className="portal-login-gate" aria-labelledby="portal-login-title">
        <h1 id="portal-login-title">portal</h1>
        <LoginForm nextPath={nextPath} isConfigured={isSupabaseConfigured()} />
        <p className="portal-login-legal">
          authorized use only. by continuing you accept our{" "}
          <a href="/terms">terms</a> and <a href="/privacy">privacy notice</a>.
        </p>
      </section>
    </main>
  );
}
