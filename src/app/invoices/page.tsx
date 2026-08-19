import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FinancialDocument } from "@/components/financial-document";
import { getCurrentUser, getDashboardData, getInvoices } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function InvoicesPage() {
  const [user, invoices, dashboard] = await Promise.all([
    getCurrentUser(),
    getInvoices(),
    getDashboardData(),
  ]);

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-normal">Invoices</h1>
      </div>
      <div className="space-y-3">
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <FinancialDocument
              key={invoice.id}
              invoice={invoice}
              engagementName={invoice.engagementName}
            />
          ))
        ) : dashboard.activeEngagements.length > 0 ? (
          <EmptyState>Your invoice will be available soon.</EmptyState>
        ) : (
          <EmptyState>You have no outstanding invoices.</EmptyState>
        )}
      </div>
    </AppShell>
  );
}
