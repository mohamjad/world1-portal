import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-sm font-semibold">world1</p>
      <h1 className="mt-6 text-2xl font-semibold tracking-normal">Terms</h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-neutral-700">
        <p>
          This portal is for authorized World1 stakeholders only. Do not access,
          download, alter, or share records unless the account and role assigned
          to you permit it.
        </p>
        <p>
          Invoices, agreements, event details, guide responsibilities, and payment
          records are confidential unless World1 states otherwise in writing.
        </p>
        <p>
          Continued use means you agree to use the portal only for legitimate
          World1 work and to report any account, access, or document issue
          promptly.
        </p>
      </div>
    </main>
  );
}
