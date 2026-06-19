---
phase: 03-measurement-conversion
reviewed: 2026-06-18T18:30:00-07:00
depth: standard
files_reviewed: 19
files_reviewed_list:
  - src/lib/analytics.ts
  - src/lib/consent.ts
  - src/lib/consent.server.ts
  - src/lib/site.ts
  - src/components/Analytics.tsx
  - src/components/ConsentBar.tsx
  - src/components/WebVitalsReporter.tsx
  - src/components/Stars.tsx
  - src/components/TrustBand.tsx
  - src/components/StickyCtaBar.tsx
  - src/components/KeyPageChrome.tsx
  - src/components/ContactForm.tsx
  - src/app/[lang]/layout.tsx
  - src/app/[lang]/page.tsx
  - src/app/[lang]/services/page.tsx
  - src/app/[lang]/services/[slug]/page.tsx
  - src/app/[lang]/faq/page.tsx
  - src/app/[lang]/laval/page.tsx
  - next.config.ts
  - package.json
findings:
  critical: 2
  warning: 3
  info: 3
  total: 8
status: needs-attention
---

# Phase 03: Measurement & Conversion — Code Review Report

**Reviewed:** 2026-06-18T18:30:00-07:00
**Depth:** standard
**Files Reviewed:** 19
**Status:** needs-attention

## Summary

This phase adds GA4 Consent Mode v2 analytics, a trust band, a sticky CTA bar, and Web Vitals
RUM to five key pages. The client/server module split (`consent.ts` vs `consent.server.ts`) is
correct and the import boundaries hold. The `Analytics.tsx` GA id validation and the
`beforeInteractive` consent-default stub ordering are sound. No PII is present in any tracked
payload.

Two critical issues exist: consent-denied users can have GA4 events dispatched from their
browser by both `ContactForm` and `StickyCtaBar`, because `track()` has no consent-state guard
of its own and relies entirely on GA4 Consent Mode server-side suppression — which is not a
client-side control. A secondary warning exists because `gtag('config')` emits a `page_view`
hit before any consent interaction occurs and `send_page_view: false` is not set. Two further
warnings cover keyboard-inaccessible tracking wrappers and an unsafe cookie value cast.

---

## Critical Issues

### CR-01: `generate_lead` fires for declined-consent users — event leaves the browser

**File:** `src/components/ContactForm.tsx:36`

**Issue:** `track("generate_lead", { method: "contact_form" })` is called unconditionally after
a successful form submission. `track()` in `analytics.ts` only guards against
`typeof window.gtag !== "function"`. When a user has clicked **Decline**, `gtag` is fully
loaded and functional — the guard passes. GA4 Consent Mode v2 suppresses attribution
server-side, but the `gtag("event", ...)` HTTP request **still leaves the browser** and reaches
`google-analytics.com`. Under Quebec Law 25, any data transmission to a third party without
consent is a violation — GA4's server-side modelling does not substitute for withholding the
transmission itself.

The same path applies to `phone_click` and `book_cta_click` in `StickyCtaBar.tsx` (lines 53
and 65): the bar renders when `consentKnown=true` (i.e., any decision was made, including
decline), and `track()` is called without checking whether that decision was `"granted"`.

**Fix:** Add a consent guard inside `track()`, or pass consent state down to callers. The
cleanest fix is a single guard in `track()`:

```typescript
// src/lib/analytics.ts
import { SS_CONSENT_COOKIE } from "./consent";

export function track(event: GaEvent, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  // Law 25 / GDPR: only dispatch when analytics_storage is explicitly granted.
  // Consent Mode v2 server-side modelling is not a substitute for suppressing
  // the outbound request on the client.
  if (document.cookie.split(";").every((c) => !c.trim().startsWith(`${SS_CONSENT_COOKIE}=granted`))) return;
  window.gtag("event", event, params);
}
```

Alternatively, add a `consentGranted: boolean` prop to both `StickyCtaBar` and `ContactForm`
and guard the `track()` call at the call site — but the single-point fix in `track()` is more
robust because it cannot be forgotten at future call sites.

---

### CR-02: `gtag('config')` sends a `page_view` hit before any consent decision

**File:** `src/components/Analytics.tsx:75`

**Issue:** The GA4 config script is:

```
gtag('js', new Date()); gtag('config', '${gaId}');
```

`gtag('config', id)` triggers an automatic `page_view` event by default when it runs. The
config script uses `strategy="afterInteractive"`, which fires after hydration — typically within
1–3 seconds of page load, well before a first-time visitor has seen or interacted with the
consent bar. The consent-default stub has correctly set `analytics_storage: 'denied'` at this
point, so GA4 Consent Mode v2 will buffer the hit. However, the stub does not include
`wait_for_update`, which instructs GA4 how long to hold the buffered hit before discarding it
if no consent update arrives. Without `wait_for_update`, GA4 applies its own default timeout
(typically 500 ms) after which the buffered hit may be sent in a modelled/cookieless form.
Whether this crosses the Law 25 threshold is a legal question, but technically the safest
posture is to suppress the `page_view` explicitly and only fire it after consent is granted.

**Fix:** Add `send_page_view: false` to the config call, and add `wait_for_update` to the
consent default. Send `page_view` manually inside `grantConsent()`:

```typescript
// Analytics.tsx — ga4-consent-default stub
__html: `
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('consent','default',{
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  analytics_storage:'denied',
  wait_for_update: 500
});
`.trim(),

// ga4-config script
__html: `gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false});`,

// analytics.ts — grantConsent()
export function grantConsent(): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("event", "page_view"); // fire the suppressed initial page_view now
}
```

---

## Warnings

### WR-01: Cookie value cast bypasses runtime validation — untrusted string treated as typed union

**File:** `src/lib/consent.server.ts:19-22`

**Issue:** The raw cookie string value is cast directly to the union type with `as`:

```typescript
return cookieStore.get(SS_CONSENT_COOKIE)?.value as
  | "granted"
  | "denied"
  | undefined;
```

`next/headers` `cookies()` returns the raw cookie string verbatim. If a user (or an attacker
with cookie-manipulation access) sets `ss_consent=anything-else`, this function returns
`"anything-else"` typed as `"granted" | "denied" | undefined`. Callers then compare
`consent !== undefined` (becomes `true`) and `consent === "granted"` (becomes `false`), which
is functionally correct for these two comparisons. However, `consentKnown` becomes `true` for
any non-empty cookie value, which could suppress the ConsentBar for a user who was never
actually asked for consent. The `as` cast silences TypeScript without providing the safety it
implies.

**Fix:** Validate at the boundary:

```typescript
const VALID_VALUES = new Set(["granted", "denied"]);

export async function readConsent(): Promise<"granted" | "denied" | undefined> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SS_CONSENT_COOKIE)?.value;
  if (value === "granted" || value === "denied") return value;
  return undefined;
}
```

---

### WR-02: `<span onClick>` tracking wrappers are keyboard-inaccessible — `track()` never fires for keyboard users

**File:** `src/components/StickyCtaBar.tsx:53, 65`

**Issue:** The tracking call is attached to `onClick` on a `<span>`:

```tsx
<span onClick={() => track("phone_click")} className="flex-1">
  <Button href={site.contact.phoneHref} ...>
```

`onClick` on a non-interactive element does not fire when a keyboard user activates the inner
`Button` via Enter or Space. The inner `Button` (rendered as `<a>` or `<Link>`) receives focus
and is activated directly, never propagating a click event to the ancestor `<span>`. As a
result, keyboard users never trigger `phone_click` or `book_cta_click` — the conversion event
is systematically missing from all keyboard-driven interactions.

The real navigation (tel:/Link) still works because it lives inside the focusable Button, so
this is a **tracking data quality bug**, not a navigation failure. However, it also means the
span's `onClick` provides no UX value for keyboard users and its presence is misleading.

**Fix:** Move `track()` to the `Button` component's interaction point, or use a wrapper element
with proper role and keyboard handling. Since `Button.tsx` bans `onClick` (D-06), the cleanest
approach for the tracking requirement is a native `<a>` element instead of `Button` for these
two CTAs, where `onClick` can be placed on the interactive element itself:

```tsx
<a
  href={site.contact.phoneHref}
  onClick={() => track("phone_click")}
  className="flex-1 inline-flex items-center justify-center ... min-h-[44px]"
>
  {dict.cta.callNow}
</a>
```

If Button.tsx cannot be changed, at minimum add `onKeyDown` to the span:

```tsx
<span
  onClick={() => track("phone_click")}
  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") track("phone_click"); }}
  className="flex-1"
>
```

---

### WR-03: `WebVitalsReporter` registers listeners without cleanup — duplicate registrations on prop change

**File:** `src/components/WebVitalsReporter.tsx:29-44`

**Issue:** The `useEffect` registers `onLCP`, `onINP`, and `onCLS` when `consentGranted` is
`true`, but returns no cleanup function. The web-vitals v5 API does not provide
unsubscribe/remove functions for these callbacks. If the component re-mounts (e.g., during
React strict-mode double-invoke in development, or future navigation patterns), listeners
accumulate and each metric fires `track()` multiple times, doubling or tripling the event count
in GA4.

In production today this is benign because `consentGranted` is SSR-derived and stable for the
page lifetime. But it is a latent bug that will silently corrupt metric data if the component
ever remounts or if consent state is wired to a runtime signal.

**Fix:** Document the non-cleanupable nature explicitly, or add a guard:

```typescript
useEffect(() => {
  if (!consentGranted) return;
  let registered = false;
  if (!registered) {
    registered = true;
    function send(m: Metric) { ... }
    onLCP(send);
    onINP(send);
    onCLS(send);
  }
  // web-vitals v5 provides no cleanup — listeners persist for page lifetime.
  // This is intentional: metrics fire once per page load, not per render.
}, [consentGranted]);
```

The real guard is ensuring this component is never unmounted/remounted after consent is granted.
A comment documenting why no cleanup is returned would prevent future maintainers from adding
a double-registration bug.

---

## Info

### IN-01: Home page `localeTag` is a 2-branch shortcut — `es` and `ar` visitors get `en-CA` number formatting

**File:** `src/app/[lang]/page.tsx:39-40`

**Issue:** The home page derives `localeTag` as:

```typescript
const localeTag = lang === "fr" ? "fr-CA" : "en-CA";
```

For `lang === "es"` this yields `"en-CA"` (English-Canada decimal/thousands separators). For
`lang === "ar"` this also yields `"en-CA"` rather than `"ar-SA"`. The `TrustBand.tsx` component
(added in this same phase) has a correct 4-way `localeTagFor()` switch that handles all four
locales. The home page rating display duplicates this logic incompletely.

**Fix:** Extract `localeTagFor()` from `TrustBand.tsx` into a shared utility (e.g.
`src/lib/i18n.ts` or a new `src/lib/format.ts` entry), then use it in both places. Alternatively
call `localeTagFor(lang)` directly after importing from `TrustBand.tsx` — though exporting a
helper from a component file is not idiomatic.

---

### IN-02: `consent.server.ts` missing `server-only` guard — no build-time enforcement of the server boundary

**File:** `src/lib/consent.server.ts`

**Issue:** The module is documented as server-only and uses `next/headers`, which will cause
a runtime error if imported in a client component. However, it does not import the
`server-only` sentinel package (a zero-byte package whose sole purpose is to cause a build
error if it is bundled into a client chunk). The current split was made to fix a Turbopack
boundary violation, but without `import "server-only"` at the top, a future developer could
re-import this module from a client component and only discover the bug at runtime (an
unhandled error in the browser).

**Fix:**

```typescript
// src/lib/consent.server.ts — add as first import
import "server-only";
```

This package is already available in any Next.js project (it ships with Next.js); no additional
dependency is needed.

---

### IN-03: `GA_ID_PATTERN` regex allows empty suffix — `G-` alone passes validation

**File:** `src/components/Analytics.tsx:19`

**Issue:** The validation regex is `/^G-[A-Z0-9-]+$/`. The `+` quantifier requires one or more
characters after `G-`, so `G-` alone is correctly rejected. However, `G--` (double dash), `G-A`
(single char), or `G---------` (only dashes) all pass. Real GA4 measurement IDs are `G-`
followed by 8–10 uppercase alphanumeric characters with no leading/trailing dashes. A
mis-configured env var like `G-XXXXXXXXXX` (with placeholder X characters) would pass and
result in a non-functional but silently-loaded GA4 tag.

This is low-risk (the site operator controls the env var), but tighter validation prevents
silent misconfiguration:

**Fix:**

```typescript
// Require at least one alphanumeric character (not just dashes) after the prefix
const GA_ID_PATTERN = /^G-[A-Z0-9][A-Z0-9-]*$/;
```

---

_Reviewed: 2026-06-18T18:30:00-07:00_
_Reviewer: Claude (adversarial code review)_
_Depth: standard_
