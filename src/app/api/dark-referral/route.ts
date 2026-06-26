// Internal log route — receives POST from proxy.ts after() callback and writes
// a PII-free row to Supabase via service-role client.
//
// Guard order (D-06 / D-05 / D-09):
//   1. DARK_REFERRAL_SECRET absent → silent no-op (graceful degrade — Pitfall 3)
//   2. x-dark-referral-secret header mismatch → 401
//   3. Non-JSON body → 400
//   4. Destructure ONLY the 4 allowlisted fields + buildInsertPayload (D-09)
//   5. Supabase unconfigured → no-op; otherwise insert via service-role
//
// No Zod schema — this is an internal route trusted after the shared-secret
// check. Contact route uses Zod for untrusted user-facing input; this does not.
import { NextResponse } from "next/server";
import { getSupabaseAdmin, DARK_REFERRALS_TABLE } from "@/lib/supabase";
import { buildInsertPayload, type DarkReferralRow } from "@/lib/dark-referral";

export async function POST(request: Request) {
  // Step 1: DARK_REFERRAL_SECRET absent → graceful no-op (NOT 401).
  // Prevents a 401-loop in dev when the env var hasn't been set yet (Pitfall 3).
  const secret = process.env.DARK_REFERRAL_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: true });
  }

  // Step 2: Verify the shared-secret header (D-06).
  const incoming = request.headers.get("x-dark-referral-secret");
  if (incoming !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 3: Parse JSON body (proxy always sends valid JSON, but guard defensively).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Step 4: Allowlist — destructure ONLY the 4 D-07 fields.
  // Any extra fields in the body (ip, user_agent, etc.) are dropped here.
  // buildInsertPayload then creates a fresh 4-key object (D-09 invariant).
  const { ai_source, referrer_host, path, utm_source } = body as DarkReferralRow;
  const row = buildInsertPayload({ ai_source, referrer_host, path, utm_source });

  // Step 5: Write via service-role (bypasses RLS — D-05).
  // Errors are swallowed — logging is best-effort; never crashes a page render.
  const db = getSupabaseAdmin();
  if (!db) {
    // Supabase unconfigured → silent no-op (graceful degrade)
    return NextResponse.json({ ok: true });
  }

  await db.from(DARK_REFERRALS_TABLE).insert(row);

  return NextResponse.json({ ok: true });
}
