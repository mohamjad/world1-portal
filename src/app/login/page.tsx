import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

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
        <p className="text-sm font-semibold">world1</p>
        <h1 className="mt-6 text-2xl font-semibold tracking-normal">Portal login</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Sign in, then an admin approves access if the account is new.
        </p>
        <LoginForm nextPath={nextPath} />
        <p className="mt-5 text-xs text-neutral-500">
          Authorized use only. By continuing you accept the{" "}
          <a href="/terms" className="underline underline-offset-4">
            terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4">
            privacy notice
          </a>
          .
        </p>
      </section>
    </main>
  );
}
