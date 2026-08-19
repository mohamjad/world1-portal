import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { isSupabaseConfigured } from "@/lib/env";

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
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-sm">
        <p className="text-xs tracking-widest text-neutral-400 uppercase">world1</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Portal</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign up</p>
        <LoginForm nextPath={nextPath} isConfigured={isSupabaseConfigured()} />
        <p className="mt-10 text-xs text-neutral-400">
          Authorized use only. By continuing you accept our{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-neutral-700">
            terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-neutral-700">
            privacy notice
          </a>
          .
        </p>
      </section>
    </main>
  );
}
