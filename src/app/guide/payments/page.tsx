import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FinancialDocument } from "@/components/financial-document";
import { getCurrentUser, getGuidePayments } from "@/lib/dal";
import type { Invoice } from "@/lib/types";

export const metadata: Metadata = {
  title: "My Payments",
};

export default async function GuidePaymentsPage() {
  const [user, payments] = await Promise.all([
    getCurrentUser(),
    getGuidePayments(),
  ]);

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-normal">Payments</h1>
      </div>
      <div className="space-y-3">
        {payments.length > 0 ? (
          payments.map((payment) => {
            const title = payment.events?.title || "Independent Payment";
            // Map GuidePayment to the Invoice shape expected by FinancialDocument
            // We coerce the type here because the component works identically for both.
            const mappedPayment = {
              id: payment.id,
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status as unknown as Invoice["status"], // "submitted" | "approved" | "paid"
              issued_date: payment.submitted_date, // mapping
              due_date: null,
              paid_date: payment.paid_date,
              file_url: payment.file_url,
              line_items: payment.line_items,
            } as Invoice;

            return (
              <FinancialDocument
                key={payment.id}
                invoice={mappedPayment}
                engagementName={title}
              />
            );
          })
        ) : (
          <EmptyState>You have no outstanding invoices.</EmptyState>
        )}
      </div>
    </AppShell>
  );
}
