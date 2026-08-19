import type { Metadata } from "next";
import { signOut } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Pending access",
};

export default async function PendingPage() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md border border-neutral-200 bg-white p-5">
        <p className="text-sm font-semibold">world1</p>
        <h1 className="mt-6 text-2xl font-semibold tracking-normal">
          Access pending
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {user.email} is in the portal queue. An admin has to approve the
          account before portal data is visible.
        </p>
        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="h-10 border border-neutral-300 bg-white px-4 text-sm font-medium hover:border-neutral-950"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
