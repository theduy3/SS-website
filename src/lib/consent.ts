// Cookie helpers for the ss_consent preference (03-01, MEAS-01).
//
// The cookie is non-sensitive (a consent preference signal, no user identity),
// so SameSite=Lax is sufficient and the Secure flag is intentionally omitted
// (per UI-SPEC line 176 — non-sensitive, Lax is correct).
//
// readConsent() is a server helper (Next.js RSC / Server Actions).
// writeConsent() is a client helper (called from ConsentBar "use client").

import { cookies } from "next/headers";

// Single source of truth for the cookie name.
// Imported by ConsentBar.test.tsx and readConsent() to keep the name in sync.
export const SS_CONSENT_COOKIE = "ss_consent";

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

// Client-side write — called from ConsentBar after the user clicks Accept or
// Decline. Uses document.cookie string assignment (same form as
// LocaleSwitch.tsx:80). max-age=31536000 = 1 year; SameSite=Lax.
// No Secure flag — non-sensitive preference value (UI-SPEC line 176).
export function writeConsent(value: "granted" | "denied"): void {
  document.cookie = `${SS_CONSENT_COOKIE}=${value};path=/;max-age=31536000;samesite=lax`;
}
