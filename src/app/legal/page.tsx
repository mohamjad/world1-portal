import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { formatDate } from "@/lib/format";
import { getAgreements, getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Legal",
};

export default async function LegalPage() {
  const [user, agreements] = await Promise.all([
    getCurrentUser(),
    getAgreements(),
  ]);

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-normal">Legal</h1>
      </div>
      <div className="space-y-3">
        {agreements.length > 0 ? (
          agreements.map((agreement) => (
            <article
              key={agreement.id}
              className="border border-neutral-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-medium">{agreement.title}</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {agreement.engagementName}
                  </p>
                </div>
                <StatusPill value={agreement.signed_status} />
              </div>
              <p className="mt-4 text-sm text-neutral-600">
                Signed {formatDate(agreement.signed_date)}
              </p>
              {agreement.file_url ? (
                <a
                  href={agreement.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                >
                  Open PDF
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState>No agreements are attached to this account.</EmptyState>
        )}
      </div>
    </AppShell>
  );
}
