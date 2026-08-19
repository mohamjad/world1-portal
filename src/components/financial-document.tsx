import { ExternalLink } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import type { Invoice } from "@/lib/types";

export function FinancialDocument({
  invoice,
  engagementName,
}: {
  invoice: Invoice;
  engagementName: string;
}) {
  return (
    <article className="border border-neutral-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium">{engagementName}</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatMoney(invoice.amount, invoice.currency)}
          </p>
        </div>
        <StatusPill value={invoice.status} />
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-neutral-500">Issued</dt>
          <dd>{formatDate(invoice.issued_date)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Due</dt>
          <dd>{formatDate(invoice.due_date)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Paid</dt>
          <dd>{formatDate(invoice.paid_date)}</dd>
        </div>
      </dl>
      {invoice.line_items.length > 0 ? (
        <div className="mt-4 border-t border-neutral-200 pt-3">
          {invoice.line_items.map((item) => (
            <div
              key={`${item.label}-${item.amount}`}
              className="flex items-center justify-between gap-4 py-1 text-sm"
            >
              <span>{item.label}</span>
              <span>{formatMoney(item.amount, invoice.currency)}</span>
            </div>
          ))}
        </div>
      ) : null}
      {invoice.file_url ? (
        <a
          href={invoice.file_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          Open PDF
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      ) : null}
    </article>
  );
}
