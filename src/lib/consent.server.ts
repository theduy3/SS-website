// Server-only consent helper for the ss_consent preference (03-01, MEAS-01).
//
// Import readConsent from THIS file in Server Components / RSC pages.
// Client-safe helpers (writeConsent, SS_CONSENT_COOKIE) remain in consent.ts.
//
// Split from consent.ts to prevent Turbopack from flagging the next/headers
// import as a client-boundary violation (Rule 1 auto-fix — pre-existing build
// error introduced in 03-02 when multiple key pages imported readConsent).
import "server-only";

import { cookies } from "next/headers";
import { SS_CONSENT_COOKIE } from "./consent";

// Server-side read via next/headers cookies() — same pattern as session.ts:2.
// Returns "granted" | "denied" if the cookie is present, undefined otherwise.
// The raw cookie value is validated at the boundary — only "granted" or
// "denied" are returned; any other string (including attacker-controlled
// values) returns undefined so callers cannot treat garbage as a known state.
export async function readConsent(): Promise<
  "granted" | "denied" | undefined
> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SS_CONSENT_COOKIE)?.value;
  if (value === "granted" || value === "denied") return value;
  return undefined;
}
