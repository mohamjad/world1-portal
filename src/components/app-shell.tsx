import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { signOut } from "@/lib/auth-actions";
import type { CurrentUser } from "@/lib/types";

const baseNavItems = [
  { href: "/", label: "Home" },
  { href: "/invoices", label: "Invoices" },
  { href: "/legal", label: "Legal" },
  { href: "/profile", label: "Profile" },
];

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const isMember = user.roles.includes("member");
  const isBacker = user.roles.includes("backer");
  const isGuide = user.roles.includes("guide");

  const navItems = [...baseNavItems];

  if (isMember) {
    navItems.push({ href: "/events", label: "Events" });
  }
  
  if (isMember || isBacker) {
    navItems.push({ href: "/directory", label: "Directory" });
  }
  
  if (isGuide) {
    navItems.push({ href: "/guide/trips", label: "Trips" });
    navItems.push({ href: "/guide/payments", label: "Payments" });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-base font-semibold tracking-normal">
              world1
            </Link>
            <nav className="flex flex-wrap items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-950"
                >
                  {item.label}
                </Link>
              ))}
              {user.isAdmin ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-950"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="max-w-[220px] truncate text-neutral-600">
              {user.name ?? user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:border-neutral-950"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
