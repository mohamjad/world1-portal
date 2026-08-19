import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-sm font-semibold">world1</p>
      <h1 className="mt-6 text-2xl font-semibold tracking-normal">Privacy</h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-neutral-700">
        <p>
          The World1 portal is a private account system for engagements, invoices,
          agreements, events, guide assignments, and stakeholder access.
        </p>
        <p>
          Account data is used to authenticate users, gate access, operate
          engagements, and maintain financial and legal records. Files are stored
          outside the database and referenced by URL.
        </p>
        <p>
          Access is limited by account approval, role grants, engagement
          ownership, guide assignments, and admin privileges. Contact World1 to
          request access changes or account removal where legally permitted.
        </p>
      </div>
    </main>
  );
}
