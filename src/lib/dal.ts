import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type {
  Agreement,
  CurrentUser,
  Engagement,
  Invoice,
  RoleGrant,
  StakeholderRole,
  UserProfile,
  PortalEvent,
} from "@/lib/types";

export const APP_ROLES: StakeholderRole[] = [
  "client",
  "member",
  "backer",
  "partner",
  "guide",
];

type AdminGrantRow = {
  user_id: string;
};

type AdminUserRow = UserProfile & {
  roles: RoleGrant[] | null;
  engagements: Pick<Engagement, "id" | "status">[] | null;
};

function profileFromAuthUser(user: {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: Record<string, unknown>;
}): UserProfile {
  return {
    id: user.id,
    email: user.email ?? "",
    name:
      typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null,
    access_status: "pending",
    created_at: user.created_at,
  };
}

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: roleRows }, { data: adminGrant }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id,email,name,access_status,created_at")
        .eq("id", user.id)
        .maybeSingle<UserProfile>(),
      supabase
        .from("roles")
        .select("role,granted_at")
        .eq("user_id", user.id)
        .returns<RoleGrant[]>(),
      supabase
        .from("admin_grants")
        .select("user_id")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .maybeSingle<AdminGrantRow>(),
    ]);

  const safeRoles =
    roleRows
      ?.map((row) => row.role)
      .filter((role): role is StakeholderRole => APP_ROLES.includes(role)) ??
    [];

  return {
    ...(profile ?? profileFromAuthUser(user)),
    roles: safeRoles,
    isAdmin: Boolean(adminGrant),
  };
});

export async function requirePortalAccess() {
  const user = await getCurrentUser();

  if (!user.isAdmin && user.access_status !== "approved") {
    redirect("/pending");
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    redirect("/access-denied");
  }

  return user;
}

export async function requireAnyRole(allowedRoles: StakeholderRole[]) {
  const user = await requirePortalAccess();
  const allowed = user.roles.some((role) => allowedRoles.includes(role));

  if (!allowed && !user.isAdmin) {
    redirect("/access-denied");
  }

  return user;
}

export async function getDashboardData() {
  const user = await requirePortalAccess();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("engagements")
    .select(
      "id,name,status,start_date,end_date,fee_structure,created_at,invoices(id,amount,currency,status,issued_date,due_date,paid_date,file_url,line_items),agreements(id,title,file_url,signed_status,signed_date)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Engagement[]>();

  if (error) {
    throw new Error(`Could not load dashboard data: ${error.message}`);
  }

  const engagements = data ?? [];
  const invoices = engagements.flatMap((engagement) =>
    (engagement.invoices ?? []).map((invoice) => ({
      ...invoice,
      engagementName: engagement.name,
    })),
  );

  return {
    user,
    engagements,
    activeEngagements: engagements.filter(
      (engagement) => engagement.status === "active",
    ),
    openInvoices: invoices.filter((invoice) =>
      ["pending", "overdue"].includes(invoice.status),
    ),
  };
}

export async function getInvoices() {
  const user = await requirePortalAccess();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("engagements")
    .select(
      "id,name,status,start_date,end_date,fee_structure,created_at,invoices(id,amount,currency,status,issued_date,due_date,paid_date,file_url,line_items)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<(Engagement & { invoices: Invoice[] })[]>();

  if (error) {
    throw new Error(`Could not load invoices: ${error.message}`);
  }

  return (data ?? []).flatMap((engagement) =>
    (engagement.invoices ?? []).map((invoice) => ({
      ...invoice,
      engagementName: engagement.name,
      engagementStatus: engagement.status,
    })),
  );
}

export async function getAgreements() {
  const user = await requirePortalAccess();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("engagements")
    .select(
      "id,name,status,start_date,end_date,fee_structure,created_at,agreements(id,title,file_url,signed_status,signed_date)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<(Engagement & { agreements: Agreement[] })[]>();

  if (error) {
    throw new Error(`Could not load agreements: ${error.message}`);
  }

  return (data ?? []).flatMap((engagement) =>
    (engagement.agreements ?? []).map((agreement) => ({
      ...agreement,
      engagementName: engagement.name,
      engagementStatus: engagement.status,
    })),
  );
}

export async function getAdminUsers() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,email,name,access_status,created_at,roles(role,granted_at),engagements(id,status)")
    .order("created_at", { ascending: false })
    .returns<AdminUserRow[]>();

  if (error) {
    throw new Error(`Could not load admin users: ${error.message}`);
  }

  return data ?? [];
}

export async function getEvents() {
  await requireAnyRole(["member"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true })
    .returns<PortalEvent[]>();

  if (error) {
    throw new Error(`Could not load events: ${error.message}`);
  }

  return data ?? [];
}

export async function getDirectory() {
  await requireAnyRole(["member", "backer"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,email,name,access_status,created_at,roles(role)")
    .eq("access_status", "approved")
    .order("name", { ascending: true })
    .returns<(UserProfile & { roles: { role: StakeholderRole }[] })[]>();

  if (error) {
    throw new Error(`Could not load directory: ${error.message}`);
  }

  return data ?? [];
}

export async function getGuideTrips() {
  const user = await requireAnyRole(["guide"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_guides")
    .select("id,responsibilities,events(*,event_participants(users(name,email)))")
    .eq("guide_user_id", user.id)
    .order("events(start_date)", { ascending: true });

  if (error) {
    throw new Error(`Could not load guide trips: ${error.message}`);
  }

  return data ?? [];
}

export async function getGuidePayments() {
  const user = await requireAnyRole(["guide"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guide_payments")
    .select("*,events(title)")
    .eq("guide_user_id", user.id)
    .order("submitted_date", { ascending: false });

  if (error) {
    throw new Error(`Could not load guide payments: ${error.message}`);
  }

  return data ?? [];
}
