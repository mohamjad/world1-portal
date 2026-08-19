import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOptionalSupabaseEnv } from "@/lib/env";

const tables = [
  "users",
  "roles",
  "admin_grants",
  "engagements",
  "invoices",
  "agreements",
  "events",
  "event_participants",
  "event_guides",
  "guide_payments",
];

export async function GET() {
  const env = getOptionalSupabaseEnv();

  if (!env) {
    return NextResponse.json(
      {
        ok: false,
        supabaseConfigured: false,
        missing: [
          !process.env.NEXT_PUBLIC_SUPABASE_URL
            ? "NEXT_PUBLIC_SUPABASE_URL"
            : null,
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
            : null,
        ].filter(Boolean),
      },
      { status: 503 },
    );
  }

  const supabase = createClient(env.url, env.anonKey, {
    auth: { persistSession: false },
  });

  const checks = await Promise.all(
    tables.map(async (table) => {
      const { error } = await supabase.from(table).select("*").limit(1);

      return {
        table,
        ok: !error,
        error: error?.message ?? null,
      };
    }),
  );

  const ok = checks.every((check) => check.ok);

  return NextResponse.json(
    {
      ok,
      supabaseConfigured: true,
      supabaseHost: new URL(env.url).host,
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}
