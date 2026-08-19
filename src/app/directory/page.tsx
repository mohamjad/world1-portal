import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser, getDirectory } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Directory",
};

export default async function DirectoryPage() {
  const [user, directory] = await Promise.all([
    getCurrentUser(),
    getDirectory(),
  ]);

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-normal">Directory</h1>
      </div>
      <div className="space-y-3">
        {directory.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {directory.map((member) => (
              <article
                key={member.id}
                className="border border-neutral-200 bg-white p-4"
              >
                <h2 className="text-base font-medium">
                  {member.name || "Unnamed"}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {member.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.roles?.map((r) => (
                    <span
                      key={r.role}
                      className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800"
                    >
                      {r.role}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>The directory is currently empty.</EmptyState>
        )}
      </div>
    </AppShell>
  );
}
