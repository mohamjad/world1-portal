# World1 Portal

Private stakeholder portal for World1 clients, members, backers, partners, and guides.

Phase 1 ships the client-side portal:

- Supabase email and Google auth
- pending account queue
- admin approval and role grants
- engagement snapshot
- invoices across engagements
- legal agreements across engagements
- profile and role view

The database is already modeled for member, backer, partner, and guide workflows.

## Local Setup

```bash
npm install
npm run dev
```

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wbuoldygtfsersajmzvv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env.local` is intentionally ignored by git.

## Supabase Setup

Run this migration in Supabase before using the app:

```text
supabase/migrations/202608190001_initial_portal_schema.sql
```

The migration bootstraps `mohammed@world1.one` as an admin account. First login with that email creates the user profile, approves it, and grants admin privileges.

Enable Supabase Auth providers:

- Email magic links
- Google

Set allowed redirect URLs:

```text
http://localhost:3000/auth/confirm
https://portal.world1.dev/auth/confirm
```

## Production

Deploy as a separate Vercel project and attach `portal.world1.dev`.

Set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wbuoldygtfsersajmzvv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=https://portal.world1.dev
```

Do not add the Supabase service role key to this app. Admin mutations run as the signed-in admin user and are enforced by RLS.

## Verification

```bash
npm audit --audit-level=moderate
npm run lint
npm run build
```
