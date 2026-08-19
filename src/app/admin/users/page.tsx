import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { AdminUserTable } from "@/components/admin-user-table";
import { getAdminUsers, requireAdmin } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Users",
};

export default async function AdminUsersPage() {
  const [user, users] = await Promise.all([requireAdmin(), getAdminUsers()]);

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-normal">Users</h1>
      </div>
      <AdminUserTable users={users} />
    </AppShell>
  );
}
