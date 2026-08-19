create extension if not exists pgcrypto;

do $$
begin
  create type public.account_access_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.app_role as enum ('client', 'member', 'backer', 'partner', 'guide');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.engagement_status as enum ('active', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.invoice_status as enum ('pending', 'paid', 'overdue');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.agreement_signed_status as enum ('pending', 'signed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_status as enum ('upcoming', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.guide_payment_status as enum ('submitted', 'approved', 'paid');
exception when duplicate_object then null;
end $$;

create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.admin_emails (email)
values ('mohammed@world1.one')
on conflict (email) do nothing;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  access_status public.account_access_status not null default 'pending',
  approved_at timestamptz,
  approved_by uuid references public.users(id),
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_lowercase check (email = lower(email))
);

create table if not exists public.admin_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.users(id),
  revoked_at timestamptz,
  unique (user_id)
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.users(id),
  unique (user_id, role)
);

create table if not exists public.engagements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  status public.engagement_status not null default 'active',
  start_date date not null,
  end_date date,
  fee_structure text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  status public.invoice_status not null default 'pending',
  issued_date date not null,
  due_date date,
  paid_date date,
  file_url text,
  line_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements(id) on delete cascade,
  title text not null default 'Agreement',
  file_url text,
  signed_status public.agreement_signed_status not null default 'pending',
  signed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  start_date timestamptz not null,
  end_date timestamptz,
  status public.event_status not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.event_guides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guide_user_id uuid not null references public.users(id) on delete cascade,
  responsibilities text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, guide_user_id)
);

create table if not exists public.guide_payments (
  id uuid primary key default gen_random_uuid(),
  guide_user_id uuid not null references public.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  status public.guide_payment_status not null default 'submitted',
  submitted_date date not null default current_date,
  paid_date date,
  file_url text,
  line_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists engagements_set_updated_at on public.engagements;
create trigger engagements_set_updated_at
before update on public.engagements
for each row execute function public.set_updated_at();

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists agreements_set_updated_at on public.agreements;
create trigger agreements_set_updated_at
before update on public.agreements
for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists event_guides_set_updated_at on public.event_guides;
create trigger event_guides_set_updated_at
before update on public.event_guides
for each row execute function public.set_updated_at();

drop trigger if exists guide_payments_set_updated_at on public.guide_payments;
create trigger guide_payments_set_updated_at
before update on public.guide_payments
for each row execute function public.set_updated_at();

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_grants
    where user_id = check_user_id
      and revoked_at is null
  );
$$;

create or replace function public.has_role(check_role public.app_role, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.roles
    where user_id = check_user_id
      and role = check_role
  );
$$;

create or replace function public.is_approved(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(check_user_id)
    or exists (
      select 1
      from public.users
      where id = check_user_id
        and access_status = 'approved'
    );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(new.email);
  display_name text := coalesce(
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name'
  );
  bootstrap_admin boolean;
begin
  select exists (
    select 1 from public.admin_emails where email = normalized_email
  ) into bootstrap_admin;

  insert into public.users (
    id,
    email,
    name,
    access_status,
    approved_at,
    created_at
  )
  values (
    new.id,
    normalized_email,
    display_name,
    case when bootstrap_admin then 'approved'::public.account_access_status else 'pending'::public.account_access_status end,
    case when bootstrap_admin then now() else null end,
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(public.users.name, excluded.name),
      updated_at = now();

  if bootstrap_admin then
    insert into public.admin_grants (user_id)
    values (new.id)
    on conflict (user_id) do update
    set revoked_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.admin_grants enable row level security;
alter table public.roles enable row level security;
alter table public.engagements enable row level security;
alter table public.invoices enable row level security;
alter table public.agreements enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_guides enable row level security;
alter table public.guide_payments enable row level security;

drop policy if exists users_select_self_or_admin on public.users;
create policy users_select_self_or_admin on public.users
for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists users_update_admin on public.users;
create policy users_update_admin on public.users
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists admin_grants_select_admin_or_self on public.admin_grants;
create policy admin_grants_select_admin_or_self on public.admin_grants
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists admin_grants_admin_write on public.admin_grants;
create policy admin_grants_admin_write on public.admin_grants
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists roles_select_self_or_admin on public.roles;
create policy roles_select_self_or_admin on public.roles
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists roles_admin_insert on public.roles;
create policy roles_admin_insert on public.roles
for insert to authenticated
with check (public.is_admin());

drop policy if exists roles_admin_update on public.roles;
create policy roles_admin_update on public.roles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists roles_admin_delete on public.roles;
create policy roles_admin_delete on public.roles
for delete to authenticated
using (public.is_admin());

drop policy if exists engagements_select_owner_or_admin on public.engagements;
create policy engagements_select_owner_or_admin on public.engagements
for select to authenticated
using ((user_id = auth.uid() and public.is_approved()) or public.is_admin());

drop policy if exists engagements_admin_write on public.engagements;
create policy engagements_admin_write on public.engagements
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists invoices_select_engagement_owner_or_admin on public.invoices;
create policy invoices_select_engagement_owner_or_admin on public.invoices
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.engagements
    where engagements.id = invoices.engagement_id
      and engagements.user_id = auth.uid()
      and public.is_approved()
  )
);

drop policy if exists invoices_admin_write on public.invoices;
create policy invoices_admin_write on public.invoices
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists agreements_select_engagement_owner_or_admin on public.agreements;
create policy agreements_select_engagement_owner_or_admin on public.agreements
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.engagements
    where engagements.id = agreements.engagement_id
      and engagements.user_id = auth.uid()
      and public.is_approved()
  )
);

drop policy if exists agreements_admin_write on public.agreements;
create policy agreements_admin_write on public.agreements
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists events_select_allowed_stakeholders on public.events;
create policy events_select_allowed_stakeholders on public.events
for select to authenticated
using (
  public.is_admin()
  or (public.is_approved() and public.has_role('member'))
  or exists (
    select 1
    from public.event_guides
    where event_guides.event_id = events.id
      and event_guides.guide_user_id = auth.uid()
  )
);

drop policy if exists events_admin_write on public.events;
create policy events_admin_write on public.events
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists event_participants_select_allowed on public.event_participants;
create policy event_participants_select_allowed on public.event_participants
for select to authenticated
using (
  public.is_admin()
  or (user_id = auth.uid() and public.is_approved())
  or exists (
    select 1
    from public.event_guides
    where event_guides.event_id = event_participants.event_id
      and event_guides.guide_user_id = auth.uid()
  )
);

drop policy if exists event_participants_admin_write on public.event_participants;
create policy event_participants_admin_write on public.event_participants
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists event_guides_select_self_or_admin on public.event_guides;
create policy event_guides_select_self_or_admin on public.event_guides
for select to authenticated
using (public.is_admin() or guide_user_id = auth.uid());

drop policy if exists event_guides_admin_write on public.event_guides;
create policy event_guides_admin_write on public.event_guides
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists guide_payments_select_self_or_admin on public.guide_payments;
create policy guide_payments_select_self_or_admin on public.guide_payments
for select to authenticated
using (public.is_admin() or guide_user_id = auth.uid());

drop policy if exists guide_payments_admin_write on public.guide_payments;
create policy guide_payments_admin_write on public.guide_payments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('world1-invoices', 'world1-invoices', false),
  ('world1-agreements', 'world1-agreements', false),
  ('world1-guide-payments', 'world1-guide-payments', false)
on conflict (id) do nothing;

drop policy if exists storage_admin_manage_world1_documents on storage.objects;
create policy storage_admin_manage_world1_documents on storage.objects
for all to authenticated
using (
  bucket_id in ('world1-invoices', 'world1-agreements', 'world1-guide-payments')
  and public.is_admin()
)
with check (
  bucket_id in ('world1-invoices', 'world1-agreements', 'world1-guide-payments')
  and public.is_admin()
);
