// Server-only consent helper for the ss_consent preference (03-01, MEAS-01).
//
// Import readConsent from THIS file in Server Components / RSC pages.
// Client-safe helpers (writeConsent, SS_CONSENT_COOKIE) remain in consent.ts.
//
// Split from consent.ts to prevent Turbopack from flagging the next/headers
// import as a client-boundary violation (Rule 1 auto-fix — pre-existing build
// error introduced in 03-02 when multiple key pages imported readConsent).

import { cookies } from "next/headers";
import { SS_CONSENT_COOKIE } from "./consent";

// Server-side read via next/headers cookies() — same pattern as session.ts:2.
// Returns "granted" | "denied" if the cookie is present, undefined otherwise.
export async function readConsent(): Promise<
  "granted" | "denied" | undefined
> {
  const cookieStore = await cookies();
  return cookieStore.get(SS_CONSENT_COOKIE)?.value as
    | "granted"
    | "denied"
    | undefined;
}
