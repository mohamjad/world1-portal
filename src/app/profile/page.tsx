import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { formatDate, titleCase } from "@/lib/format";
import { requirePortalAccess } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await requirePortalAccess();

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-normal">Profile</h1>
      </div>
      <section className="border border-neutral-200 bg-white p-4">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Name</dt>
            <dd>{user.name ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Created</dt>
            <dd>{formatDate(user.created_at.slice(0, 10))}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Roles</dt>
            <dd className="flex flex-wrap gap-2">
              {user.roles.length > 0
                ? user.roles.map((role) => (
                    <span
                      key={role}
                      className="border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs"
                    >
                      {titleCase(role)}
                    </span>
                  ))
                : "No stakeholder role granted"}
              {user.isAdmin ? (
                <span className="border border-neutral-950 bg-neutral-950 px-2 py-1 text-xs text-white">
                  Admin
                </span>
              ) : null}
            </dd>
          </div>
        </dl>
      </section>
    </AppShell>
  );
}
