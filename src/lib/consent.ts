// Client-safe cookie helpers for the ss_consent preference (03-01, MEAS-01).
//
// This file is safe to import from "use client" components — it has NO
// next/headers dependency. Server-only readConsent() lives in consent.server.ts.
//
// The cookie is non-sensitive (a consent preference signal, no user identity),
// so SameSite=Lax is sufficient and the Secure flag is intentionally omitted
// (per UI-SPEC line 176 — non-sensitive, Lax is correct).

// Single source of truth for the cookie name.
// Imported by ConsentBar.tsx, ConsentBar.test.tsx, and consent.server.ts.
export const SS_CONSENT_COOKIE = "ss_consent";

// Client-side write — called from ConsentBar after the user clicks Accept or
// Decline. Uses document.cookie string assignment (same form as
// LocaleSwitch.tsx:80). max-age=31536000 = 1 year; SameSite=Lax.
// No Secure flag — non-sensitive preference value (UI-SPEC line 176).
export function writeConsent(value: "granted" | "denied"): void {
  document.cookie = `${SS_CONSENT_COOKIE}=${value};path=/;max-age=31536000;samesite=lax`;
}
