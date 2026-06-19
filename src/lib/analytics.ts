// GA4 event tracking helpers for Sans Souci Ongles & Spa (03-01, MEAS-01).
//
// All calls are guarded: server-side renders (typeof window === "undefined")
// and missing gtag (script not yet loaded / GA id unset) both no-op silently.
// No PII is ever sent — param values are developer-controlled labels only.

import { SS_CONSENT_COOKIE } from "./consent";

// Window augmentation so TypeScript knows about gtag without a separate @types
// package. The function signature is intentionally loose — GA accepts a wide
// union of overload shapes and we only call two of them here.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Union of every GA4 custom event name used on this site.
// Downstream call sites (plan 03-02) must use one of these — TypeScript will
// catch any typo at compile time.
export type GaEvent =
  | "phone_click"
  | "book_cta_click"
  | "generate_lead"
  | "web_vitals";

// Returns true only when the user has explicitly granted analytics consent.
// Reads the ss_consent cookie client-side — same cookie name as the server-side
// readConsent() helper. Inline cookie scan avoids a React state dependency so
// track() can be called from any context (form submit handlers, link clicks, etc).
function hasConsentGranted(): boolean {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${SS_CONSENT_COOKIE}=granted`));
}

// Send a GA4 custom event.
// Guards (in order):
//   1. No-op on the server.
//   2. No-op when gtag is not yet a function (script not loaded / GA id unset).
//   3. No-op unless the user has explicitly granted analytics consent (CR-01).
//      Law 25 / GDPR: GA4 Consent Mode v2 server-side modelling does NOT
//      substitute for suppressing the outbound HTTP request on the client.
// Params are optional non-PII labels.
export function track(
  event: GaEvent,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  if (!hasConsentGranted()) return;
  window.gtag("event", event, params);
}

// Flip analytics_storage to granted after the user clicks Accept.
// Only called from ConsentBar — never called automatically.
// Guards match track() so a missing gtag silently no-ops.
// After updating consent, fires one manual page_view to record the visit that
// was suppressed while consent was pending (CR-02 — send_page_view:false is
// set on gtag('config') so no automatic page_view was sent at load time).
export function grantConsent(): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", { analytics_storage: "granted" });
  // Fire the page_view that was suppressed at config time (send_page_view:false).
  // This is the single page_view for the session — not fired again by track().
  window.gtag("event", "page_view");
}
