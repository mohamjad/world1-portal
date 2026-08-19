# World1 Portal Production Checklist

## Supabase

- Run `supabase/migrations/202608190001_initial_portal_schema.sql` in the Supabase SQL editor or through the Supabase CLI.
- Confirm `mohammed@world1.one` exists in `public.admin_emails` before first login.
- In Auth providers, enable Email magic links and Google.
- In Auth URL configuration, set Site URL to `https://portal.world1.dev`.
- Add redirect URLs:
  - `https://portal.world1.dev/auth/confirm`
  - `http://localhost:3000/auth/confirm`
- Keep the service role key out of browser code and out of git.
- Keep document buckets private. Use admin-controlled upload paths or signed URLs for document delivery.

## Vercel

- Create a separate Vercel project for this repo.
- Set environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL=https://portal.world1.dev`
- Add `portal.world1.dev` to the Vercel project.
- In Dynadot DNS, point `portal` as a CNAME to the Vercel target.

## Security

- Keep RLS enabled on every portal table.
- Do not add service role usage to route handlers for normal user/admin actions.
- Review admin actions before adding new mutations; every server action must call `requireAdmin()` or a narrower authorization helper.
- Keep `robots.ts` disallowing the full portal.
- Run `npm audit`, `npm run lint`, and `npm run build` before deploy.

## Legal

- The included Terms and Privacy pages are operational notices, not a substitute for legal review.
- Have counsel review financial record retention, privacy wording, and document access terms before broad stakeholder rollout.
- Keep invoice PDFs, agreements, guide payment records, and event rosters access-controlled and private.
