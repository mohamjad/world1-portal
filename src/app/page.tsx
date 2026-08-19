import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { formatDate, formatMoney } from "@/lib/format";
import { getDashboardData } from "@/lib/dal";

export default async function Home() {
  const { user, activeEngagements, openInvoices } = await getDashboardData();

  return (
    <AppShell user={user}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">Portal</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {user.name ?? user.email}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {activeEngagements.length > 0 ? (
              activeEngagements.map((engagement) => (
                <article
                  key={engagement.id}
                  className="border border-neutral-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-base font-medium">
                        {engagement.name}
                      </h2>
                      <p className="mt-1 text-sm text-neutral-600">
                        Started {formatDate(engagement.start_date)}
                      </p>
                    </div>
                    <StatusPill value={engagement.status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-neutral-500">Fee structure</dt>
                      <dd>{engagement.fee_structure}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">End date</dt>
                      <dd>{formatDate(engagement.end_date)}</dd>
                    </div>
                  </dl>
                </article>
              ))
            ) : (
              <EmptyState>No active engagement is attached to this account.</EmptyState>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-base font-medium">Open invoices</h2>
          <div className="space-y-3">
            {openInvoices.length > 0 ? (
              openInvoices.map((invoice) => (
                <article
                  key={invoice.id}
                  className="border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-neutral-600">
                        {invoice.engagementName}
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {formatMoney(invoice.amount, invoice.currency)}
                      </p>
                    </div>
                    <StatusPill value={invoice.status} />
                  </div>
                  <p className="mt-3 text-sm text-neutral-600">
                    Due {formatDate(invoice.due_date)}
                  </p>
                </article>
              ))
            ) : activeEngagements.length > 0 ? (
              <EmptyState>Your invoice will be available soon.</EmptyState>
            ) : (
              <EmptyState>You have no outstanding invoices.</EmptyState>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
