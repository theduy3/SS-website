# Phase 3: Measurement & Conversion - Pattern Map

**Mapped:** 2026-06-18
**Files analyzed:** 16 (5 new components, 1 new + 1 optional lib, 2 modified existing components, 6 modified pages, next.config, 4 dictionaries)
**Analogs found:** 13 / 13 mappable files (3 files have no in-repo analog — listed at bottom)

> **Two load-bearing repo facts (honor these):**
> 1. Root layout is `src/app/[lang]/layout.tsx` — there is **NO** `src/app/layout.tsx`. UI-SPEC line 407 is wrong for this repo (RESEARCH Pitfall 2, verified).
> 2. There is **no shared key-page layout segment** — services / `[slug]` / faq / laval are siblings under one `[lang]/layout.tsx`. TrustBand + StickyCtaBar must mount **per-page** on the 5 key pages (home, services index, `/services/[slug]`, faq, `/laval`), NOT in the shared layout (RESEARCH Pitfall 5, D-09).

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/Analytics.tsx` | provider (script mount) | event-driven (script load) | `JsonLd.tsx` (script-injection) + layout `verification` env-read | role-match |
| `src/components/ConsentBar.tsx` | component (client) | event-driven (cookie write + gtag) | `LocaleSwitch.tsx` (cookie write + outside-click + JS-mounted UI) | exact |
| `src/components/StickyCtaBar.tsx` | component (client) | event-driven (click → track) | `Header.tsx` (sticky bar + Button + localizedHref + RTL/`md:hidden`) | exact |
| `src/components/TrustBand.tsx` | component (server) | request-response (SSR render) | `ReviewCard.tsx` (Stars + rating) + home `page.tsx` rating block | exact |
| `src/components/WebVitalsReporter.tsx` | component (client) | streaming (metric callbacks → track) | `Reveal.tsx` (`"use client"` + `useEffect`/hydration gate, returns null path) | role-match |
| `src/lib/analytics.ts` | utility | transform (guarded event push) | `reviews.ts` (typed module exports + guard constants) | role-match |
| `src/lib/consent.ts` (optional) | utility | file-I/O (cookie read/write) | `session.ts` (`cookies()` server read) + `LocaleSwitch.tsx:80` (client write) | role-match |
| `src/lib/site.ts` | config | — | self (extend existing object) | exact |
| `src/app/[lang]/layout.tsx` | layout | request-response | self (extend; mirror `verification` env-read at lines 63-68) | exact |
| `src/app/[lang]/page.tsx` (home) | page | request-response | self (mount TrustBand + StickyCtaBar) | exact |
| `src/app/[lang]/services/page.tsx` | page | request-response | home `page.tsx` mount pattern | role-match |
| `src/app/[lang]/services/[slug]/page.tsx` | page | request-response | home `page.tsx` mount pattern | role-match |
| `src/app/[lang]/faq/page.tsx` | page | request-response | home `page.tsx` mount pattern | role-match |
| `src/app/[lang]/laval/page.tsx` | page | request-response | home `page.tsx` mount pattern | role-match |
| `src/components/ContactForm.tsx` | component (client) | event-driven (success → track) | self (success branch verified line 34) | exact |
| `next.config.ts` | config | build tooling | self (wrap existing `nextConfig` export) | exact |
| `src/dictionaries/{en,fr,es,ar}.json` | config (i18n) | — | self (extend `consent.*` + `trust.*` namespaces) | exact |

---

## Pattern Assignments

### `src/components/ConsentBar.tsx` (component, client — cookie write + gtag)

**Analog:** `src/components/LocaleSwitch.tsx` — best match in repo: client component, writes a cookie via `document.cookie`, JS-mounted conditional UI, outside-click/Escape handling, RTL-aware via inherited `dir`.

**`"use client"` + cookie-write pattern** (`LocaleSwitch.tsx:1`, `:79-82`):
```tsx
"use client";
// ...
onClick={() => {
  document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000`;
  setOpen(false);
}}
```
Copy this exact `document.cookie` shape for `ss_consent`. RESEARCH Pattern 3 specifies: `ss_consent` = `"granted" | "denied"`, `SameSite=Lax`, no `Secure` (non-sensitive). So:
`document.cookie = "ss_consent=granted;path=/;max-age=31536000;samesite=lax"`.

**JS-mounted (not SSR-visible) gate** — DO NOT copy `LocaleSwitch`'s `{open && ...}` directly; ConsentBar must be absent from SSR HTML (UI-SPEC line 155, SSR Verification Contract line 390). Use the hydration gate from `Reveal.tsx:9-15`:
```tsx
const noopSubscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(noopSubscribe, () => true, () => false);
// returns false on server/first paint → bar not in SSR HTML; true after hydrate
```
Render the bar only when `useHydrated()` is true AND the server-passed `consentKnown` prop is false.

**Native `<button>` (NOT Button.tsx)** — UI-SPEC line 174 forbids `onClick` on `Button.tsx`. Consent buttons need `<button type="button">`. Copy the visual class string from `ContactForm.tsx:70` (a native button styled like Button):
```tsx
className="inline-flex w-fit items-center justify-center rounded-pill bg-espresso px-8 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-mocha disabled:opacity-60"
```
For the espresso-bar context use `variant="light"` classes from `Button.tsx:8` (`bg-cream text-espresso hover:bg-tan`) for Accept and `border border-current` (outline, `Button.tsx:9-10`) for Decline.

**gtag consent update** — call `grantConsent()` from `src/lib/analytics.ts` (RESEARCH §2) on Accept only; Decline writes the cookie and does nothing else (UI-SPEC Interaction Contract lines 321-322).

**Dictionary props** — pass `dict` typed like `ContactForm.tsx:13` (`Pick<Dictionary, "consent">`). Bar copy keys: `consent.body / accept / decline / ariaLabel` (UI-SPEC copy table).

---

### `src/components/StickyCtaBar.tsx` (component, client — click → track)

**Analog:** `src/components/Header.tsx` — the existing sticky bar with `Button` + locale-prefixed hrefs + `md:hidden` + RTL. StickyCtaBar is its bottom-of-viewport mirror.

**Sticky shell + espresso surface** (`Header.tsx:36`):
```tsx
<header className="sticky top-0 z-50 bg-espresso text-cream">
```
Mirror as: `fixed bottom-0 left-0 right-0 z-40 bg-espresso text-cream py-3 px-4 md:hidden` (UI-SPEC lines 192-209). `z-40` is below Header `z-50` and PopupHost `z-[100]`.

**Inner max-width container** (`Header.tsx:37` / `:210`):
```tsx
<div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
```
Use `flex gap-3 items-center justify-center max-w-7xl mx-auto` per UI-SPEC line 210.

**locale-prefixed Button href** (`Header.tsx:32-33`, `:82-84`):
```tsx
const localizedHref = (href: string) =>
  href === "/" ? `/${locale}` : `/${locale}${href}`;
// ...
<Button href={localizedHref(site.booking)} variant="light">{dict.cta.book}</Button>
```
Copy `localizedHref` verbatim. Book → `localizedHref(site.booking)` (`site.booking` = `/appointments`, `site.ts:15`). Call → `site.contact.phoneHref` (`site.ts:53` = `"tel:+14505056450"`; note it is `site.contact.phoneHref`, NOT `site.phoneHref` — RESEARCH §4 excerpt is slightly off here).

**Event wrapper that does NOT touch Button.tsx** (RESEARCH §4, Pattern 4 — the load-bearing constraint):
```tsx
<span onClick={() => track("phone_click")}>
  <Button href={site.contact.phoneHref} variant="light" className="flex-1 min-h-[44px]">
    {dict.cta.callNow}
  </Button>
</span>
<span onClick={() => track("book_cta_click")}>
  <Button href={localizedHref(site.booking)} variant="light" className="flex-1 min-h-[44px]">
    {dict.cta.book}
  </Button>
</span>
```
The wrapping `<span onClick>` intercepts; the inner `<a>`/`<Link>` (from `Button.tsx:38-55`) still performs the tel:/navigation. `track()` is from `src/lib/analytics.ts`.

**RTL** — `Header` relies on inherited `dir` from `<html dir={dirFor(lang)}>` (`layout.tsx:83`, `i18n.ts:12`). For button order swap in RTL (UI-SPEC line 205: Book before Call), apply `flex-row-reverse` when `dirFor(locale) === "rtl"`.

**Render gate** — suppress while `ss_consent` cookie absent to avoid double bottom-bar with ConsentBar (UI-SPEC line 200, RESEARCH Open Q4). Receive `consentKnown` as a prop from the page (SSR cookie read) or gate on client cookie presence.

---

### `src/components/TrustBand.tsx` (component, server — SSR render)

**Analog:** `src/components/ReviewCard.tsx` (Stars + rating) + the home `page.tsx` rating block (lines 35-39, the live `site.reviews` formatting).

**Server component, NO `"use client"`** — `ReviewCard.tsx` has no client directive; copy that. Plain SSR so crawlers see it (UI-SPEC line 231, RESEARCH Pitfall 3). MUST NOT be wrapped in `<Reveal>` (Anti-Pattern, RESEARCH line 247).

**Stars with size override** (`ReviewCard.tsx:7`, `Stars.tsx:3`):
```tsx
<Stars className="text-espresso" />   // ReviewCard uses default h-6 w-6
```
For TrustBand, override to `h-4 w-4` per UI-SPEC line 243. NOTE: `Stars.tsx:7` hardcodes `h-6 w-6` on the `<svg>` — the `className` prop lands on the wrapping `<div>` (`Stars.tsx:5`), so `h-4 w-4` on the div does NOT shrink the SVGs. **The planner must either (a) make `Stars.tsx` accept a size prop applied to the `<svg>`, or (b) accept default star size in the band.** Flag for planning (surgical: prefer a `size` prop on Stars).

**Live-data gate** (`seo.ts:163-169` — the SCHEMA-03 `reviewsFetchedAt` pattern):
```ts
import { reviewsFetchedAt } from "@/lib/reviews";
// ...
...(reviewsFetchedAt
  ? { aggregateRating: { ratingValue: site.reviews.ratingValue,
        reviewCount: site.reviews.reviewCount, bestRating: site.reviews.bestRating } }
  : {})
```
Mirror this guard: render rating + reviewCount block ONLY when `reviewsFetchedAt` is truthy (UI-SPEC line 233); else render `dict.trust.established` only. `site.reviews.{ratingValue,reviewCount,bestRating}` already exist (`site.ts:36-38`).
> ⚠ State note: `google-reviews.json` currently has `fetchedAt: "2026-06-06..."` with **placeholder** aggregate (`4.2 / 312`) per memory obs 28626. The gate will currently render the rating. Planner should be aware the displayed numbers are placeholder until a real fetch lands.

**Locale-aware rating format** (home `page.tsx:34-39`):
```tsx
const localeTag = lang === "fr" ? "fr-CA" : "en-CA";
const ratingDisplay = site.reviews.ratingValue.toLocaleString(localeTag, { minimumFractionDigits: 1 });
const reviewCountDisplay = site.reviews.reviewCount.toLocaleString(localeTag);
```
Reuse this formatting. Extend `localeTag` for `es`/`ar` (currently only en/fr branch — home page predates 4-locale support; planner should generalize).

**"Since 2024" — static, no `new Date()`** (D-08, Anti-Pattern RESEARCH line 249): render `dict.trust.established` (string "Since 2024"), sourced conceptually from `site.established` (new field). Muted: `text-tan` per UI-SPEC line 248.

**Layout** per UI-SPEC lines 238-249: `bg-fog py-2 px-6` band, `flex flex-wrap items-center gap-3 max-w-7xl mx-auto` inner — same `max-w-7xl mx-auto` container as `Header.tsx:37`.

---

### `src/components/Analytics.tsx` (provider — GA4 script mount)

**Analog:** `JsonLd.tsx` (script-injection into the tree) + `layout.tsx:63-68` (env-read with unset → omit). No exact GA4 analog exists; this composes the documented `next/script` pattern (RESEARCH §1).

**Env-gated no-op** — mirror the `layout.tsx` verification env pattern (lines 63-68: unset env → Next omits the tag):
```tsx
const gaId = process.env.NEXT_PUBLIC_GA_ID;
if (!gaId) return null; // no-op build (D-01)
```
Security: validate `gaId` matches `^G-[A-Z0-9]+$` before interpolating into the inline script (RESEARCH Security Domain — XSS sink mitigation).

**Consent default stub (beforeInteractive) → GA4 loader (afterInteractive)** — ordering is load-bearing (RESEARCH Pattern 1 / Code §1). Use the exact two-script structure from RESEARCH §1 (lines 322-332). Fallback if `beforeInteractive` is rejected in `[lang]/layout.tsx`: inline `<script dangerouslySetInnerHTML>` for the stub (RESEARCH line 211, A4).

---

### `src/components/WebVitalsReporter.tsx` (component, client — metric stream → track)

**Analog:** `Reveal.tsx` — `"use client"` + `useEffect`-driven side effects + returns null/passthrough. WebVitalsReporter is `"use client"` + `useEffect` + `return null`.

**Structure** (RESEARCH §3, verified web-vitals v5 API):
```tsx
"use client";
import { useEffect } from "react";
import { onLCP, onINP, onCLS, type Metric } from "web-vitals";
import { track } from "@/lib/analytics";
export function WebVitalsReporter({ consentGranted }: { consentGranted: boolean }) {
  useEffect(() => {
    if (!consentGranted) return;
    const send = (m: Metric) =>
      track("web_vitals", { metric_name: m.name, value: Math.round(m.value), metric_rating: m.rating, metric_id: m.id });
    onLCP(send); onINP(send); onCLS(send);
  }, [consentGranted]);
  return null;
}
```
Consent-gated (RESEARCH Pitfall 6) — register listeners only when `consentGranted`. Uses LCP/INP/CLS only (NO `onFID` — removed in v5, RESEARCH State of the Art).

---

### `src/lib/analytics.ts` (utility — guarded track helper) [NEW, no analog]

**Closest analog:** `reviews.ts` — small typed lib module with named exports + a guard constant (`reviewsFetchedAt`). Follow its shape: typed exports, terse doc comment, no class.

**Content** (RESEARCH §2):
```ts
declare global { interface Window { gtag?: (...args: unknown[]) => void } }
export type GaEvent = "phone_click" | "book_cta_click" | "generate_lead" | "web_vitals";
export function track(event: GaEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}
export function grantConsent(): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("consent", "update", { analytics_storage: "granted" });
  }
}
```
Guard satisfies global rule "fail silently, no PII leak" (RESEARCH Security V7). Param shapes are Claude's discretion (D-04).

---

### `src/lib/consent.ts` (optional utility — cookie read/write)

**Analog:** `session.ts:2,42-43` (server read via `next/headers` `cookies()`) + `LocaleSwitch.tsx:80` (client write via `document.cookie`).

**Server read** (`session.ts:42-43`):
```ts
import { cookies } from "next/headers";
export async function getSession() { return getIronSession<SessionData>(await cookies(), sessionOptions); }
```
Mirror for consent: `const c = await cookies(); return c.get("ss_consent")?.value as "granted"|"denied"|undefined;`
**Client write** — copy `LocaleSwitch.tsx:80` cookie-string form (see ConsentBar section). Optional file — planner may inline these instead.

---

### `src/components/ContactForm.tsx` (MODIFY — generate_lead hook)

**Analog:** self. The `success` branch is verified at `ContactForm.tsx:34` (`setStatus("success")`), inside `handleSubmit`. Already `"use client"` (line 1) — zero new client boundary.

**Hook point** (after line 34, RESEARCH §5):
```ts
setStatus("success");
track("generate_lead", { method: "contact_form" });  // ADD this line
form.reset();
```
Add `import { track } from "@/lib/analytics";` to the import block (currently lines 1-4). Send NO form field values (PII rule, RESEARCH Security — only `method`).

---

### `src/app/[lang]/layout.tsx` (MODIFY — mount Analytics, ConsentBar, WebVitalsReporter)

**Analog:** self. Mirror the existing env-read convention (`layout.tsx:63-68`) and the existing sitewide component mounts (`<Header>`, `<Footer>`, `<PopupHost>` at lines 94-97).

**SSR cookie read** — add `import { cookies } from "next/headers"` (same import as `session.ts:2`); read `ss_consent` in the `RootLayout` async body (line 76 area) to pass `consentKnown`/`consentGranted` props to ConsentBar + WebVitalsReporter (RESEARCH Pattern 3).

**Mount points** — add inside `<body>` (after line 86 / alongside lines 94-97):
- `<Analytics />` (renders nothing if `NEXT_PUBLIC_GA_ID` unset)
- `<ConsentBar dict={...} locale={lang} consentKnown={...} />`
- `<WebVitalsReporter consentGranted={...} />`

**DO NOT** mount TrustBand / StickyCtaBar here — that would render them sitewide, violating D-09 (RESEARCH Pitfall 5).

---

### Key pages (MODIFY ×5) — mount TrustBand + StickyCtaBar

**Files:** `src/app/[lang]/page.tsx` (home), `services/page.tsx`, `services/[slug]/page.tsx`, `faq/page.tsx`, `laval/page.tsx`.

**Analog:** home `page.tsx` — already imports `site`, `getDictionary`, `dirFor`, has `{ lang }` and `dict` in scope (lines 28-32), already renders the rating numbers (lines 35-39).

**Per RESEARCH structure note (line 200):** cleanest DRY = a single `<KeyPageChrome locale dict reviews />` wrapper rendering both TrustBand + StickyCtaBar, imported into each of the 5 files — "key page = one import". Planner's call (D-09 structure is Claude's discretion).

**Body padding** — each page's main/wrapper needs `pb-[64px] md:pb-0` so the fixed sticky bar doesn't cover bottom content (UI-SPEC line 219).

---

### `next.config.ts` (MODIFY — bundle analyzer wrap)

**Analog:** self. The file exports `nextConfig` at line 51. Wrap it (RESEARCH §7 / Pattern 5):
```ts
import bundleAnalyzer from "@next/bundle-analyzer";
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
export default withBundleAnalyzer(nextConfig);  // replaces line 51
```
⚠ Verify the analyzer emits a treemap under this Turbopack build (`turbopack: { root: __dirname }`, line 33) — RESEARCH Open Q3/A6: if not, run the analyze pass without `--turbopack`. Add `.next/analyze` to `.gitignore`.

---

### `src/dictionaries/{en,fr,es,ar}.json` (MODIFY — add namespaces)

**Analog:** self. `Dictionary` type is derived from `en.json` (`dictionary.ts:1-4`: `export type Dictionary = typeof en`) — so adding keys to `en.json` automatically extends the type; the other 3 locales must match the shape or TS errors.

**Existing `cta` namespace** (`en.json:36-44`): `cta.book` ("Book now"), `cta.callNow` ("Call now") ALREADY exist in EN. Verify all 4 locales have them; add where missing (UI-SPEC line 281).

**Add** `consent.{body,accept,decline,ariaLabel}` and `trust.{established,reviewsWord}` to all 4 locales — exact copy in UI-SPEC tables (lines 267-279). Dictionary single-source discipline (Phase 2 D-01/D-02) — never hardcode in components.

---

## Shared Patterns

### Guarded event firing (`track()`)
**Source:** `src/lib/analytics.ts` (NEW; shape from RESEARCH §2).
**Apply to:** `StickyCtaBar.tsx`, `ContactForm.tsx`, `WebVitalsReporter.tsx`, `ConsentBar.tsx` (via `grantConsent`).
Every GA4 event/consent call goes through this guard (`typeof window.gtag !== "function"` → no-op). Never call `window.gtag` directly in components.

### Cookie: server-read / client-write
**Server read source:** `session.ts:2,42-43` (`next/headers` `cookies()`).
**Client write source:** `LocaleSwitch.tsx:80` (`document.cookie = "...;path=/;max-age=..."`).
**Apply to:** `ConsentBar.tsx` (write `ss_consent`), `layout.tsx` (read for `consentKnown`/`consentGranted` props), key pages (read to gate StickyCtaBar). `ss_consent`: values `granted|denied`, `SameSite=Lax`, no `Secure`.

### Locale-prefixed internal hrefs
**Source:** `Header.tsx:32-33` (`localizedHref`).
**Apply to:** `StickyCtaBar.tsx` Book button, key-page mounts. Verbatim copy.

### Dictionary single-source (no hardcoded copy)
**Source:** `ContactForm.tsx:13` (`dict: Pick<Dictionary, ...>` prop), `dictionary.ts:1-4` (type derived from `en.json`).
**Apply to:** `ConsentBar.tsx`, `StickyCtaBar.tsx`, `TrustBand.tsx`. Pass a narrowed `Pick<Dictionary, ...>` prop; never inline strings.

### SSR-visibility vs JS-only mount
**Source:** `Reveal.tsx:9-15` (`useSyncExternalStore` hydration gate) — JS-only; `ReviewCard.tsx` / `seo.ts` — SSR-visible.
**Apply to:** TrustBand = SSR-visible server component (in HTML, no motion). ConsentBar = JS-only (absent from SSR HTML). StickyCtaBar markup is SSR'd but render-gated on consent cookie.

### Env-gated, unset → omit
**Source:** `layout.tsx:63-68` (verification env: unset → Next omits tag).
**Apply to:** `Analytics.tsx` (`NEXT_PUBLIC_GA_ID` unset → `return null`), `next.config.ts` (`ANALYZE` unset → analyzer disabled).

---

## No Analog Found

Files with no close in-repo match (planner should use RESEARCH.md code examples + Google/Vercel docs as the primary reference):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/Analytics.tsx` | provider | script-load | No existing `next/script` / GA4 usage in repo (memory obs 32371: no analytics installed). Use RESEARCH §1. Closest structural hint only: `JsonLd.tsx` + `layout.tsx` env-read. |
| `src/components/WebVitalsReporter.tsx` | component | streaming | No RUM/`web-vitals` precedent. Use RESEARCH §3 (verified v5 API). `Reveal.tsx` gives only the `"use client"`+effect+null shell. |
| `src/lib/analytics.ts` | utility | transform | No client analytics helper exists. Use RESEARCH §2. `reviews.ts` gives only the module-shape convention. |

---

## Metadata

**Analog search scope:** `src/components/`, `src/lib/`, `src/app/[lang]/`, `src/data/`, `next.config.ts`, `src/dictionaries/`
**Files scanned (read in full):** `ContactForm.tsx`, `LocaleSwitch.tsx`, `Header.tsx`, `Button.tsx`, `site.ts`, `session.ts`, `[lang]/layout.tsx`, `Stars.tsx`, `ReviewCard.tsx`, `reviews.ts`, `next.config.ts`, `Reveal.tsx`; partial: home `page.tsx`, `seo.ts` (gate), `i18n.ts`, `dictionary.ts`, `en.json` (cta), `google-reviews.json`
**Pattern extraction date:** 2026-06-18
