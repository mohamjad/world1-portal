"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase-server";
import type { AccountAccessStatus, StakeholderRole } from "@/lib/types";

const allowedStatuses: AccountAccessStatus[] = [
  "pending",
  "approved",
  "rejected",
];

const allowedRoles: StakeholderRole[] = [
  "client",
  "member",
  "backer",
  "partner",
  "guide",
];

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateAccountStatus(formData: FormData) {
  const admin = await requireAdmin();
  const userId = readString(formData, "userId");
  const accessStatus = readString(
    formData,
    "accessStatus",
  ) as AccountAccessStatus;

  if (!userId || !allowedStatuses.includes(accessStatus)) {
    throw new Error("Invalid account status update.");
  }

  const supabase = await createClient();
  const timestamp = new Date().toISOString();
  const updates =
    accessStatus === "approved"
      ? {
          access_status: accessStatus,
          approved_at: timestamp,
          approved_by: admin.id,
          rejected_at: null,
        }
      : accessStatus === "rejected"
        ? {
            access_status: accessStatus,
            rejected_at: timestamp,
          }
        : {
            access_status: accessStatus,
            approved_at: null,
            approved_by: null,
            rejected_at: null,
          };

  const { error } = await supabase.from("users").update(updates).eq("id", userId);

  if (error) {
    throw new Error(`Could not update account status: ${error.message}`);
  }

  revalidatePath("/admin/users");
}

export async function grantRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = readString(formData, "userId");
  const role = readString(formData, "role") as StakeholderRole;

  if (!userId || !allowedRoles.includes(role)) {
    throw new Error("Invalid role grant.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("roles").upsert(
    {
      user_id: userId,
      role,
      granted_by: admin.id,
    },
    { onConflict: "user_id,role" },
  );

  if (error) {
    throw new Error(`Could not grant role: ${error.message}`);
  }

  revalidatePath("/admin/users");
}

export async function revokeRole(formData: FormData) {
  await requireAdmin();
  const userId = readString(formData, "userId");
  const role = readString(formData, "role") as StakeholderRole;

  if (!userId || !allowedRoles.includes(role)) {
    throw new Error("Invalid role revoke.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  if (error) {
    throw new Error(`Could not revoke role: ${error.message}`);
  }

  revalidatePath("/admin/users");
}
