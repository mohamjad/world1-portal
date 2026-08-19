export type StakeholderRole =
  | "client"
  | "member"
  | "backer"
  | "partner"
  | "guide";

export type EngagementStatus = "active" | "completed" | "cancelled";
export type InvoiceStatus = "pending" | "paid" | "overdue";
export type AgreementStatus = "pending" | "signed";
export type EventStatus = "upcoming" | "completed" | "cancelled";
export type GuidePaymentStatus = "submitted" | "approved" | "paid";
export type AccountAccessStatus = "pending" | "approved" | "rejected";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  access_status: AccountAccessStatus;
  created_at: string;
};

export type RoleGrant = {
  role: StakeholderRole;
  granted_at: string;
};

export type LineItem = {
  label: string;
  amount: number;
};

export type Invoice = {
  id: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issued_date: string;
  due_date: string | null;
  paid_date: string | null;
  file_url: string | null;
  line_items: LineItem[];
};

export type Agreement = {
  id: string;
  title: string;
  file_url: string | null;
  signed_status: AgreementStatus;
  signed_date: string | null;
};

export type Engagement = {
  id: string;
  name: string;
  status: EngagementStatus;
  start_date: string;
  end_date: string | null;
  fee_structure: string;
  created_at: string;
  invoices?: Invoice[];
  agreements?: Agreement[];
};

export type CurrentUser = UserProfile & {
  roles: StakeholderRole[];
  isAdmin: boolean;
};

export type PortalEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  status: EventStatus;
  created_at: string;
};

export type EventParticipant = {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
};

export type EventGuide = {
  id: string;
  event_id: string;
  guide_user_id: string;
  responsibilities: string | null;
  created_at: string;
};

export type GuidePayment = {
  id: string;
  guide_user_id: string;
  event_id: string | null;
  amount: number;
  currency: string;
  status: GuidePaymentStatus;
  submitted_date: string;
  paid_date: string | null;
  file_url: string | null;
  line_items: LineItem[];
};
