import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Setup error",
};

export default function SetupErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md border border-neutral-200 bg-white p-5">
        <p className="text-sm font-semibold">world1</p>
        <h1 className="mt-6 text-2xl font-semibold tracking-normal">
          Setup error
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Portal auth is missing required Supabase environment variables in the
          deployment.
        </p>
        <Link
          href="/api/health"
          className="mt-6 inline-flex h-10 items-center border border-neutral-300 bg-white px-4 text-sm font-medium hover:border-neutral-950"
        >
          Check health
        </Link>
      </section>
    </main>
  );
}
