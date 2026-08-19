import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Access denied",
};

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-sm">
        <p className="text-sm font-semibold">world1</p>
        <h1 className="mt-6 text-2xl font-semibold tracking-normal">Access denied</h1>
        <p className="mt-2 text-sm text-neutral-600">
          This account does not have the required portal access.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center bg-neutral-950 px-4 text-sm font-medium text-white"
        >
          Back to portal
        </Link>
      </section>
    </main>
  );
}
