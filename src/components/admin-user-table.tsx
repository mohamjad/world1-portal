import { grantRole, revokeRole, updateAccountStatus } from "@/lib/admin-actions";
import { APP_ROLES } from "@/lib/dal";
import { formatDate, titleCase } from "@/lib/format";
import type { RoleGrant, StakeholderRole, UserProfile } from "@/lib/types";

type AdminUserRow = UserProfile & {
  roles: RoleGrant[] | null;
  engagements: { id: string; status: string }[] | null;
};

export function AdminUserTable({ users }: { users: AdminUserRow[] }) {
  return (
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
        <thead>
          <tr className="text-neutral-500">
            <th className="px-4 py-3 font-medium">Account</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Roles</th>
            <th className="px-4 py-3 font-medium">Engagements</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {users.map((row) => {
            const grantedRoles = new Set(
              (row.roles ?? []).map((role) => role.role),
            );

            return (
              <tr key={row.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.name ?? "Not set"}</div>
                  <div className="text-neutral-600">{row.email}</div>
                </td>
                <td className="px-4 py-3">
                  <form action={updateAccountStatus} className="flex gap-2">
                    <input type="hidden" name="userId" value={row.id} />
                    <select
                      name="accessStatus"
                      defaultValue={row.access_status}
                      className="h-9 border border-neutral-300 bg-white px-2"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      type="submit"
                      className="h-9 border border-neutral-300 px-3 font-medium hover:border-neutral-950"
                    >
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-[260px] flex-wrap gap-2">
                    {APP_ROLES.map((role) => (
                      <RoleToggle
                        key={role}
                        userId={row.id}
                        role={role}
                        active={grantedRoles.has(role)}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">{row.engagements?.length ?? 0}</td>
                <td className="px-4 py-3">
                  {formatDate(row.created_at.slice(0, 10))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RoleToggle({
  userId,
  role,
  active,
}: {
  userId: string;
  role: StakeholderRole;
  active: boolean;
}) {
  return (
    <form action={active ? revokeRole : grantRole}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        className={`h-8 border px-2 text-xs font-medium ${
          active
            ? "border-neutral-950 bg-neutral-950 text-white"
            : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
        }`}
      >
        {titleCase(role)}
      </button>
    </form>
  );
}
