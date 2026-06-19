// GA4 event tracking helpers for Sans Souci Ongles & Spa (03-01, MEAS-01).
//
// All calls are guarded: server-side renders (typeof window === "undefined")
// and missing gtag (script not yet loaded / GA id unset) both no-op silently.
// No PII is ever sent — param values are developer-controlled labels only.

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

// Send a GA4 custom event.
// Guards: no-ops on the server, and when gtag is not yet a function (script
// not loaded or NEXT_PUBLIC_GA_ID unset). Params are optional non-PII labels.
export function track(
  event: GaEvent,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

// Flip analytics_storage to granted after the user clicks Accept.
// Only called from ConsentBar — never called automatically.
// Guards match track() so a missing gtag silently no-ops.
export function grantConsent(): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", { analytics_storage: "granted" });
}
