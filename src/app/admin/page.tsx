import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-normal">Admin</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/users"
          className="border border-neutral-200 bg-white p-4 hover:border-neutral-950"
        >
          <h2 className="text-base font-medium">Users</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Accounts, roles, and engagement presence.
          </p>
        </Link>
      </div>
    </AppShell>
  );
}
