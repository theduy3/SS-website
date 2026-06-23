# Phase 3: Measurement & Conversion - Research

**Researched:** 2026-06-18
**Domain:** Web analytics instrumentation (GA4 + Consent Mode v2), conversion event wiring, RUM (Core Web Vitals), bundle analysis — on a custom Next.js 16.2.6 / React 19.2.4 App Router SSR site
**Confidence:** HIGH (codebase verified in-session; Next docs read in-repo; package versions verified on npm registry; Consent Mode ordering cited from Google official docs)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**GA4 Analytics & Consent (MEAS-01)**
- **D-01:** Measurement ID via `process.env.NEXT_PUBLIC_GA_ID`, injected with `next/script`. Tag **no-ops if unset** (safe build). User creates GA4 property + sets the ID in **Dokploy** (runtime-secret convention; ID stays out of git).
- **D-02:** **Google Consent Mode v2**, `analytics_storage` **default-denied**. Minimal Accept/Decline bottom-bar flips it on opt-in. Banner copy in all 4 locales via dictionary single-source, **RTL-aware**. **Decline keeps storage denied** (no granular toggles — analytics-only, no ad/remarketing).
- **D-03:** AI-referrer capture = **GA4 custom channel-group regex only**. Claude **drafts the regex**; **user pastes into GA4 console**. **No code-side referrer tagging.** Channel **must be configured before the first new page goes live** — GA4 channel groups do not backfill.

**Conversion Events (MEAS-02)**
- **D-04:** Event naming = GA4 recommended + custom mix: `generate_lead` (contact-form success), `phone_click`, `book_cta_click`.
- **D-05:** Booking tracked as **click-intent only** (`book_cta_click` → `/appointments`). **Completion is unmeasured** (cross-domain SalonX widget at `app.onglessanssouci.com`). Event name reflects *intent*, not confirmed booking.
- **D-06:** Hooks live at **component level** — instrument the phone `tel:` link, the book CTA, and `ContactForm` once; events fire wherever those render (DRY; no per-page wiring).

**Sticky CTA & Trust Signals (MEAS-03)**
- **D-07:** New **sticky-bottom, mobile-only bar** with Call + Book. RTL-aware; coexists with sticky-top `Header`; z-index **below** popup/modal layers.
- **D-08:** Above-fold trust band = **rating + review count** (from `site.reviews`, gated on live data per SCHEMA-03 `reviewsFetchedAt`) as **primary**; **"Since 2024"** as **secondary**. Add **`established: 2024`** to `src/lib/site.ts`; render a **static "Since 2024"** string (no dynamic `Date()`). Hierarchy = rating prominent, "Since 2024" muted.
- **D-09:** Sticky CTA + trust scope = **key pages only** (home, services index, `/services/[slug]`, FAQ hub, `/laval`); **always visible** (not hide-on-scroll).

**CWV / web-vitals RUM (MEAS-04)**
- **D-10:** Install **`web-vitals`**; send **LCP/INP/CLS as GA4 `web_vitals` events** (metric name + value + rating). **Consent-gated** (same Law 25 gate). No new infra/endpoint.
- **D-11:** Framer-Motion double-load = **evidence-first**: add **`@next/bundle-analyzer`** behind `ANALYZE=true`, inspect server/client bundles. **Refactor only if duplication found**; if clean, just lock the gate.
- **D-12:** CWV "good" target scope = **key pages only** (same set as D-09).

### Claude's Discretion
- GA4 event **payload/param shapes** beyond the chosen event names.
- Consent-state **storage mechanism** (cookie vs localStorage) — pick an SSR-safe approach that survives reloads.
- Exact **channel-group regex** patterns (Claude drafts; user pastes into GA4).
- `bundle-analyzer` script/CI wiring.
- Sticky-bar styling within the existing design system.
- Which events to flag as GA4 **"key events" (conversions)** in the console.

### Deferred Ideas (OUT OF SCOPE)
- **Cross-domain booking-completion tracking** (GA4 cross-domain linker / SalonX `postMessage`) — needs SalonX cooperation.
- **Code-side AI-referrer tagging** (belt-and-suspenders custom dimension) — declined for v1.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MEAS-01 | GA4 installed with a custom channel group capturing AI referrers; configured before first new page ships (no backfill) | Consent Mode v2 ordering (Pattern 1), env-gated `next/script` loader (Pattern 2), AI-referrer regex draft (Code Examples §6), no-backfill sequencing (Open Question 1) |
| MEAS-02 | Page-level conversion events for phone call, contact-form submit, booking-CTA click | Component-level wrapper pattern that does NOT touch `Button.tsx` (Pattern 4 + Code Examples §4); `generate_lead` hook in `ContactForm.tsx` success branch (verified at line 42); `typeof gtag !== "undefined"` guard |
| MEAS-03 | Sticky mobile CTA + above-fold trust signals on key pages | No shared key-page layout exists — per-page mount required (Architecture §Project Structure + Pitfall 5); `site.reviews` live-data gate already in repo; `established: 2024` add to `site.ts`; SSR visibility rule (Pitfall 3) |
| MEAS-04 | `web-vitals` RUM (INP/CLS) captured; key pages meet "good" CWV; no regression from added schema/content | `web-vitals` v5 API `onLCP/onINP/onCLS` → gtag event (Code Examples §3); `@next/bundle-analyzer` wiring (Pattern 5); Framer-Motion double-load detection (Pitfall 4) |
</phase_requirements>

## Summary

This phase is **configuration + instrumentation + three small UI surfaces** on an existing, healthy Next.js 16.2.6 / React 19.2.4 App Router SSR site. There is **no new analytics infrastructure** — GA4 is a `next/script` tag, Consent Mode is a tiny inline gtag stub, conversion events are `gtag(...)` calls behind a guard, and RUM is the `web-vitals` npm package piping metrics into the same `gtag`. The dominant risk is **ordering and SSR-safety**, not complexity.

Two load-bearing facts the planner must absorb. **First**, the actual root layout is `src/app/[lang]/layout.tsx` — there is **no `src/app/layout.tsx`** (the UI-SPEC's reference to `src/app/layout.tsx` is incorrect for this repo). GA4, the consent default stub, the ConsentBar, and the web-vitals reporter all mount in `[lang]/layout.tsx`. **Second**, there is **no shared "key-page" layout segment** — services/`[slug]`/faq/laval are sibling routes under one `[lang]/layout.tsx`. So the sticky CTA bar and trust band (key-pages-only, D-09) cannot be mounted in a shared sub-layout; they must be mounted **per-page** on exactly the five key pages, or behind a small allowlist helper. This is the single biggest planning decision.

The Consent Mode v2 ordering is the other correctness gate: the `gtag('consent','default',{analytics_storage:'denied'})` stub **must execute before** GA4's `gtag.js` loads `[CITED: developers.google.com/tag-platform/security/guides/consent]`. With `next/script`, that means the inline default-consent stub runs at `beforeInteractive` (or is an inline script placed ahead of the GA loader) while the GA4 loader runs at `afterInteractive`. Getting this backwards silently breaks default-denied compliance (Law 25).

**Primary recommendation:** Build one tiny client `Analytics` wrapper (consent stub + env-gated GA4 `next/script` + consent helpers), instrument the three events via thin client wrappers that call a shared `track()` helper guarded by `typeof window.gtag !== "undefined"` (never edit `Button.tsx`), mount the consent bar + web-vitals reporter in `[lang]/layout.tsx`, and mount TrustBand + StickyCtaBar per-page on the five key pages. Configure the GA4 property and AI-referrer channel group in the console **before** deploying — it does not backfill.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| GA4 tag load | Browser / Client | Frontend Server (SSR injects `<Script>`) | `next/script afterInteractive` is client-executed; layout is SSR-rendered |
| Consent default state (denied) | Browser / Client | — | Must run in-browser before gtag.js; inline stub, no server round-trip |
| Consent decision persistence | Browser / Client (cookie write) | Frontend Server (SSR cookie read for first-paint bar suppression) | `document.cookie` write client-side; `cookies()` read server-side to decide bar visibility |
| Conversion events (phone/book/lead) | Browser / Client | — | User-interaction events fire in the browser via `gtag` |
| AI-referrer channel group | External (GA4 console) | — | Pure GA4 admin config; no code. User pastes regex (D-03) |
| Trust band (rating/reviews/Since 2024) | Frontend Server (SSR) | — | Must be in SSR HTML for crawlers; pure server component, no client JS |
| Sticky CTA bar | Browser / Client | Frontend Server (SSR markup) | `"use client"` for event wiring + `md:hidden`; markup SSR'd |
| web-vitals RUM | Browser / Client | — | RUM is measured in-browser post-hydration; consent-gated |
| Bundle analysis | Build tooling | — | `@next/bundle-analyzer` is a build-time wrapper, not runtime |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/script` | built-in (Next 16.2.6) | Inject GA4 `gtag.js` + inline consent stub with controlled load strategy | Official Next.js API; the documented way to load third-party analytics `[VERIFIED: node_modules/next/dist/docs/01-app/.../script.md]` |
| GA4 `gtag.js` | Google-hosted (`https://www.googletagmanager.com/gtag/js?id=...`) | Analytics + consent + custom events | Google's canonical analytics tag; no npm install |
| `web-vitals` | **5.3.0** | RUM: `onLCP`, `onINP`, `onCLS` → GA4 `web_vitals` events | Google's official CWV measurement lib; 26M weekly downloads `[VERIFIED: npm registry — GoogleChrome/web-vitals]` |
| `@next/bundle-analyzer` | **16.2.9** | `ANALYZE=true` server/client bundle inspection | Official Vercel/Next.js first-party tool; tracks the Next release line `[VERIFIED: npm registry — vercel/next.js]` |

### Supporting (already in repo — reuse, do not reinstall)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/headers` `cookies()` | built-in | SSR cookie read (for first-paint consent-bar suppression) | Already used by `src/lib/session.ts` (iron-session) — same import |
| `framer-motion` | ^12.39.0 | Existing motion (Header, Reveal, PopupHost) | **Subject of the D-11 double-load audit** — do not add new usages this phase |
| `Button.tsx` | local | CTA primitive for sticky bar | Reuse `variant="light"`; **do NOT add `onClick`** (UI-SPEC line 174) |
| `Stars.tsx` | local | Trust-band star row | Reuse with `className` size override (`h-4 w-4`) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next/script` for GA4 | `@next/third-parties` `GoogleAnalytics` | `@next/third-parties` is simpler BUT does **not** give you control over the Consent Mode v2 default-denied ordering (it loads gtag without an inline `consent default` stub first) — incompatible with Law 25 default-denied requirement. Use `next/script` for explicit ordering control. `[ASSUMED]` — verify if planner wants to evaluate. |
| Cookie for consent | `localStorage` | localStorage is not readable server-side → first-paint bar suppression would require a client flash (CLS risk). Cookie is SSR-readable. **Cookie wins** (matches UI-SPEC `ss_consent` decision + existing `NEXT_LOCALE` cookie pattern in `LocaleSwitch.tsx`). |
| Custom RUM endpoint | `web-vitals` → existing `gtag` | D-10 explicitly: no new infra. Pipe into GA4. |

**Installation:**
```bash
bun add web-vitals
bun add -d @next/bundle-analyzer
```
(Repo uses `bun` per global CLAUDE.md; confirm lockfile — `package-lock.json` present means npm may be canonical. Check `ls bun.lock package-lock.json` before choosing; defer to the project lockfile.)

**Version verification (done in-session, 2026-06-18):**
- `npm view web-vitals version` → `5.3.0` (latest; `next` dist-tag also 5.3.0)
- `npm view @next/bundle-analyzer version` → `16.2.9`
- Neither package declares a `postinstall` script (verified `scripts.postinstall` → null on both).

> ⚠️ **Version correction:** CONTEXT.md and the additional-context brief say "web-vitals v4". The current major is **v5** (5.3.0). The relevant API (`onLCP`, `onINP`, `onCLS`) is identical in v4 and v5; the v5 break is the removal of the deprecated `onFID` (FID is fully replaced by INP). Since this phase only uses LCP/INP/CLS, **v5 is the correct target** and no v4 pin is needed.

## Package Legitimacy Audit

| Package | Registry | Age (last publish) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|--------------------|-----------|-------------|---------|-------------|
| `web-vitals` | npm | published 2026-05-28 | 26.3M/wk | github.com/GoogleChrome/web-vitals | **SUS (too-new)** | **Keep — false positive.** Official Google package, 26M wk downloads. Planner adds one `checkpoint:human-verify` before install. |
| `@next/bundle-analyzer` | npm | published 2026-06-09 | 4.56M/wk | github.com/vercel/next.js | **SUS (too-new)** | **Keep — false positive.** Official Vercel monorepo package, tracks Next 16.2.x releases. Planner adds one `checkpoint:human-verify` before install. |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `web-vitals`, `@next/bundle-analyzer` — both flagged **only** on the `too-new` heuristic, which fires because both are high-frequency-republished first-party packages (web-vitals republishes often; `@next/bundle-analyzer` republishes on every Next release, last being 16.2.9). Both have authoritative source repos (GoogleChrome, vercel/next.js), millions of weekly downloads, no postinstall scripts, and are not deprecated. These are unambiguously legitimate. Per protocol the planner should still insert a `checkpoint:human-verify` task before each install, but the human verification here is expected to be a trivial confirm.

## Architecture Patterns

### System Architecture Diagram

```
                            ┌─────────────────────────────────────────────┐
  Page request  ──────────► │  src/app/[lang]/layout.tsx  (root layout,    │
                            │  SSR, the ONLY layout segment)               │
                            │                                              │
                            │  cookies().get("ss_consent")  ──┐            │
                            │                                 │ (server)   │
                            │  <html dir={dirFor(lang)}>      ▼            │
                            │    <Analytics gaId={env}        consent      │
                            │       consentKnown={cookie}/>   default      │
                            │    <Header/> <main>{children}</main>         │
                            │    <Footer/> <PopupHost/>                    │
                            │    <ConsentBar/>  ◄── client, JS-mounted     │
                            │    <WebVitalsReporter/> ◄── client           │
                            └───────────────┬──────────────────────────────┘
                                            │ (hydration, browser)
            ┌───────────────────────────────┼────────────────────────────────┐
            ▼                                ▼                                ▼
  ┌──────────────────┐         ┌──────────────────────┐        ┌────────────────────┐
  │ Consent stub     │         │ GA4 gtag.js loader    │        │ web-vitals          │
  │ (beforeInteract.)│ ──before─►│ next/script           │        │ onLCP/onINP/onCLS   │
  │ consent:default  │  loads  │ afterInteractive       │        │ (post-hydration)    │
  │ analytics:denied │         │ id=NEXT_PUBLIC_GA_ID   │        └─────────┬──────────┘
  └────────┬─────────┘         │ (skipped if unset)     │                  │
           │                   └───────────┬────────────┘                  │
   user clicks Accept                      │                               │
           ▼                               ▼                               ▼
  gtag('consent','update',         window.gtag('event', ...)        gtag('event','web_vitals',{
   {analytics_storage:'granted'})   phone_click / book_cta_click /    metric_name, value, rating})
  + set ss_consent cookie           generate_lead                     ── all guarded by
                                    ── from thin client wrappers          typeof window.gtag!=='undefined'
                                       (NOT Button.tsx)                    AND consent === granted
                                            │
                                            ▼
                              ┌─────────────────────────────────┐
                              │  GA4 property (external console) │
                              │  • AI-referrer custom channel    │
                              │    group regex (user-pasted)     │
                              │  • key events flagged as         │
                              │    conversions                   │
                              └─────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── app/[lang]/
│   ├── layout.tsx                # MODIFY: mount <Analytics>, <ConsentBar>, <WebVitalsReporter>; SSR-read ss_consent cookie
│   ├── page.tsx                  # MODIFY (home key page): mount <TrustBand> + <StickyCtaBar>
│   ├── services/page.tsx         # MODIFY (key page): mount TrustBand + StickyCtaBar
│   ├── services/[slug]/page.tsx  # MODIFY (key page): mount TrustBand + StickyCtaBar
│   ├── faq/page.tsx              # MODIFY (key page): mount TrustBand + StickyCtaBar
│   └── laval/page.tsx            # MODIFY (key page): mount TrustBand + StickyCtaBar
├── components/
│   ├── Analytics.tsx             # NEW (client): consent default stub + env-gated GA4 next/script
│   ├── ConsentBar.tsx            # NEW (client): reads/writes ss_consent, calls gtag consent update
│   ├── StickyCtaBar.tsx          # NEW (client): md:hidden Call+Book, fires phone_click/book_cta_click
│   ├── TrustBand.tsx             # NEW (server): rating+reviewCount (live-gated) + "Since 2024"
│   ├── WebVitalsReporter.tsx     # NEW (client): web-vitals onLCP/onINP/onCLS → gtag, consent-gated
│   └── ContactForm.tsx           # MODIFY: fire generate_lead in the success branch (line 42)
├── lib/
│   ├── site.ts                   # MODIFY: add established: 2024
│   ├── analytics.ts              # NEW: track() helper with typeof gtag guard + consent constants
│   └── consent.ts                # NEW (optional): ss_consent cookie read/write helpers (client + server)
└── dictionaries/{en,fr,es,ar}.json  # MODIFY: add consent.* and trust.* namespaces (UI-SPEC copy table)
```

> **Note on key-page mounting:** Because there is no shared key-page layout segment, the cleanest DRY option is a single `<KeyPageChrome locale dict reviews/>` wrapper component that renders both `TrustBand` and `StickyCtaBar`, imported into exactly the five key page files. This keeps "key page = one import" and avoids duplicating two mounts × five pages. Planner's call (Claude's discretion on structure).

### Pattern 1: Consent Mode v2 default-denied — ordering is load-bearing
**What:** The `gtag('consent','default',{analytics_storage:'denied'})` call MUST run before `gtag.js` loads/configs. `[CITED: developers.google.com/tag-platform/security/guides/consent]` ("If your consent code is called out of order, consent defaults won't work").
**When to use:** Always, for Law 25 / default-denied.
**How with `next/script`:** Two scripts in the layout:
1. An **inline** stub at `strategy="beforeInteractive"` that defines `dataLayer`/`gtag` and pushes the `consent default` (denied). `beforeInteractive` is documented as the strategy for cookie-consent managers and runs before first-party code `[VERIFIED: node_modules/next/dist/docs/.../script.md]`.
2. The **GA4 loader** `<Script src="...gtag/js?id=GA_ID" strategy="afterInteractive">` plus an inline `afterInteractive` config script (`gtag('js', new Date()); gtag('config', GA_ID)`).

Because the default stub is `beforeInteractive` and the loader is `afterInteractive`, ordering is guaranteed. Both render only when `NEXT_PUBLIC_GA_ID` is set (no-op build otherwise, D-01).

> **Caveat (verify in this build):** `beforeInteractive` scripts "must be placed inside the root layout" — here that is `[lang]/layout.tsx`. `onLoad`/`onReady`/`onError` do **not** work with `beforeInteractive` and only run in client components `[VERIFIED: script.md]`. The stub uses inline content (no `onLoad`), so this is fine. If the planner prefers, the consent default can instead be a plain inline `<script dangerouslySetInnerHTML>` in the layout `<head>` region — equally valid and avoids the `beforeInteractive` placement constraint. Pick one; both satisfy ordering.

### Pattern 2: Env-gated GA4 loader (no-op if unset)
**What:** GA4 renders nothing when `NEXT_PUBLIC_GA_ID` is absent → safe builds in dev/preview without an ID.
```tsx
// Source: composed from next/script docs (script.md) + Google consent docs
const gaId = process.env.NEXT_PUBLIC_GA_ID;
if (!gaId) return null;   // no-op build (D-01)
```
**Why `NEXT_PUBLIC_`:** Required for the value to be inlined into the client bundle. Set in Dokploy at build/runtime (runtime-secret convention). Note: `NEXT_PUBLIC_` vars are baked at **build time** for static pages — confirm Dokploy provides it at build, not only runtime, for this `output: "standalone"` Docker build (see Open Question 2).

### Pattern 3: SSR-safe consent cookie (read server, write client)
**What:** `ss_consent` cookie = `"granted" | "denied"`. Server reads it in `[lang]/layout.tsx` via `cookies()` (already imported pattern, `src/lib/session.ts`). Client writes it via `document.cookie` (already used in `LocaleSwitch.tsx` line 80: `document.cookie = "NEXT_LOCALE=...;path=/;max-age=..."`).
**Why:** Server-read lets the consent bar be suppressed on first paint when a decision exists (no CLS, no flash). Client-write persists the decision. SameSite=Lax, no Secure needed (non-sensitive, UI-SPEC line 176).
**Hydration safety:** The ConsentBar is **JS-mounted, not in SSR HTML** (UI-SPEC line 155). Pass the server-read cookie value as a prop so the client knows whether to render the bar — avoids a render→hide flash. Use `useSyncExternalStore` hydration-gate pattern (already in `Reveal.tsx`) if a "mounted" gate is needed.

### Pattern 4: Component-level event firing WITHOUT touching Button.tsx
**What:** `Button.tsx` renders an `<a>`/`<Link>` and must NOT gain an `onClick` prop (UI-SPEC line 174). Wire events in **thin wrapper client components** that intercept the click before/around the Button, or render a native element with the same classes.
**Three hook points (D-06):**
- `phone_click` — wrapper around the `tel:` Button in `StickyCtaBar` (and anywhere the phone CTA renders). The wrapper's `onClick` calls `track("phone_click")`; the `<a href="tel:...">` still performs the call.
- `book_cta_click` — wrapper around the Book Button in `StickyCtaBar`; `onClick` → `track("book_cta_click")` then navigation proceeds.
- `generate_lead` — fire inside `ContactForm.tsx` at the existing success branch (verified line 42: `if (status === "success")`). Add `track("generate_lead")` in `handleSubmit` right after `setStatus("success")` (line ~35). `ContactForm` is already `"use client"` — zero new client boundary.
**Guard:** every fire goes through `track()` which checks `typeof window.gtag !== "undefined"` AND consent === granted before pushing. No-op otherwise (graceful when GA unset/declined).

### Pattern 5: `@next/bundle-analyzer` with this `next.config.ts`
**What:** Wrap the existing default export. The repo's `next.config.ts` already exports `nextConfig`; wrap it:
```ts
// Source: @next/bundle-analyzer README pattern
import bundleAnalyzer from "@next/bundle-analyzer";
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
export default withBundleAnalyzer(nextConfig);
```
**Important:** This config is **TypeScript** (`next.config.ts`) and the project uses **Turbopack** (`turbopack: { root: __dirname }`). Confirm bundle-analyzer (webpack-based) runs correctly — `ANALYZE=true bun run build` historically uses webpack for the analyzer report. In Next 16, `next build` may default to Turbopack; the analyzer reads the webpack-style stats. **Verify** the analyzer produces a report under this build (Open Question 3). The success criterion is `ANALYZE=true bun run build` confirming Framer Motion is not double-loaded — the planner must validate the analyzer actually emits the client/server treemap with this Turbopack config.

### Anti-Patterns to Avoid
- **Adding `onClick` to `Button.tsx`** — explicitly forbidden (UI-SPEC line 174). Use wrappers.
- **Mounting trust band inside `<Reveal>` / any Framer wrapper** — `opacity:0` hides it from AI crawlers (Phase 2 carried-forward pitfall; STATE.md decision 02-02). Trust band is plain SSR.
- **Rendering the consent bar in SSR HTML as visible** — causes CLS and confuses crawlers (UI-SPEC line 155). JS-mount only.
- **`new Date()` in trust band** — non-deterministic, hydration mismatch. Static "Since 2024" string from `site.established` (D-08).
- **Loading GA4 before the consent default stub** — breaks default-denied (Pattern 1).
- **Firing events when consent denied or gtag undefined** — always route through the guarded `track()`.
- **Putting trust band / sticky bar in a shared layout** — there is no key-page-only layout segment; doing this in `[lang]/layout.tsx` would render them on ALL pages (contact, appointments, legal), violating D-09.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GA4 script injection | Manual `<script>` string in `<head>` | `next/script` with `strategy` | Handles dedup, load timing, hydration; official API |
| CWV measurement | Custom `PerformanceObserver` for LCP/INP/CLS | `web-vitals` `onLCP/onINP/onCLS` | INP/CLS attribution + reporting edge cases (bfcache, final values, soft-nav) are non-trivial; Google maintains the canonical impl |
| Bundle dedup detection | grep node_modules / manual graph | `@next/bundle-analyzer` treemap | Visual server/client treemap is the established Framer double-load detector (D-11) |
| Consent default ordering | Ad-hoc script tags | Documented `beforeInteractive` stub → `afterInteractive` loader | Out-of-order consent silently fails (Google docs) |
| Cookie read on server | `headers().get("cookie")` parse | `next/headers` `cookies()` | Already the repo pattern (`session.ts`); typed, parsed |

**Key insight:** Nothing in this phase requires a custom abstraction. The only bespoke code is (a) the ~15-line `track()` guard helper, (b) three thin click wrappers, and (c) three small presentational components. Everything load-bearing (script timing, CWV math, bundle graph, consent semantics) is delegated to first-party Google/Vercel tooling.

## Common Pitfalls

### Pitfall 1: GA4 loaded before consent default → default-denied silently broken
**What goes wrong:** Analytics storage is granted by default; Law 25 compliance fails even though a bar is shown.
**Why it happens:** `next/script` `afterInteractive` (GA loader) runs but the consent default stub wasn't ordered before it.
**How to avoid:** Consent default stub at `beforeInteractive` (or inline `<script>` ahead of the loader); GA loader at `afterInteractive`. (Pattern 1.)
**Warning signs:** GA4 DebugView shows hits/cookies before any Accept click; `analytics_storage` reads `granted` on first load in the gtag consent state.

### Pitfall 2: Wrong layout path — mounting in `src/app/layout.tsx`
**What goes wrong:** Edits to a non-existent `src/app/layout.tsx`, or creating one, fragments the layout tree.
**Why it happens:** UI-SPEC line 407 and common Next.js convention both say `src/app/layout.tsx`, but **this repo's root layout is `src/app/[lang]/layout.tsx`** (verified: `find src/app -name layout.tsx` returns `[lang]/layout.tsx`, `admin/layout.tsx`, etc. — no top-level `app/layout.tsx`).
**How to avoid:** Mount GA4 / ConsentBar / WebVitalsReporter in `src/app/[lang]/layout.tsx`. (Non-`[lang]` routes like `/admin`, `/checkin`, `/clientportal` have their own layouts and are out of scope — analytics only needs the public localized site.)
**Warning signs:** Analytics absent on `/en`, `/fr` pages; or a new top-level layout duplicating `<html>`.

### Pitfall 3: Trust band / sticky bar hidden from crawlers via opacity-0 motion
**What goes wrong:** Wrapping trust signals in `<Reveal>` (or any `initial={{opacity:0}}`) hides them from AI/search crawlers that don't run the IntersectionObserver.
**Why it happens:** Framer Motion `<Reveal>` is the default "make it appear nicely" reflex; it sets `opacity:0` until in-view.
**How to avoid:** Trust band is a **server component**, plain SSR, no motion (UI-SPEC §Animation; STATE.md 02-02 decision). `Reveal.tsx` actually renders visible pre-hydration (it has a hydration gate), but the rule stands: do not wrap SSR-critical trust text in motion.
**Warning signs:** `curl .../en/ | grep "Since 2024"` returns nothing, or returns markup with `style="opacity:0"`.

### Pitfall 4: Framer Motion double-loaded across server/client bundles
**What goes wrong:** `framer-motion` ends up in both the server and client bundle, or duplicated across client chunks, inflating JS and hurting INP/LCP.
**Why it happens:** Mixed import boundaries — a server component importing a module that transitively pulls framer-motion into the server graph, or multiple `"use client"` islands each bundling it. Current usages: `Header.tsx`, `Reveal.tsx`, `PopupHost.tsx` (all `"use client"`).
**How to avoid:** Evidence-first (D-11). Run `ANALYZE=true bun run build`, inspect the client treemap for a single shared `framer-motion` chunk. Refactor import/`"use client"` boundaries **only if duplication is shown**.
**Warning signs:** Two `framer-motion` nodes in the analyzer treemap; framer-motion appearing in the server bundle report.

### Pitfall 5: Sticky bar / trust band leaking onto non-key pages
**What goes wrong:** D-09 limits trust+sticky to five key pages, but mounting in the shared `[lang]/layout.tsx` would render them everywhere (contact, appointments, legal).
**Why it happens:** No shared key-page layout segment exists; the instinct to "mount once" lands in the only layout, which is sitewide.
**How to avoid:** Per-page mount (or a `<KeyPageChrome>` wrapper imported into the five key page files). The sticky bar also needs `pb-[64px] md:pb-0` on those pages' main wrapper (UI-SPEC line 219).
**Warning signs:** `curl .../en/contact | grep "callNow"` matches the sticky bar; trust band on `/appointments`.

### Pitfall 6: `web-vitals` reporting before consent → Law 25 leak
**What goes wrong:** RUM events sent to GA4 before opt-in.
**Why it happens:** `onLCP/onINP/onCLS` callbacks fire on metric availability regardless of consent.
**How to avoid:** Route web-vitals through the same guarded `track()` (consent === granted AND `typeof gtag !== "undefined"`). Either register the listeners only after consent, or buffer and flush on grant. Simplest: register always, but `track()` drops the event when consent isn't granted. (Note: GA4 with Consent Mode v2 already withholds storage when denied, but the explicit guard keeps `web_vitals` events from being sent at all — cleaner for Law 25.)
**Warning signs:** `web_vitals` events in GA4 Realtime before any Accept.

### Pitfall 7: INP/CLS are not final until page lifecycle end
**What goes wrong:** Reporting LCP/INP/CLS too early gives wrong values; "good threshold" checks read provisional numbers.
**Why it happens:** INP and CLS accumulate; final values land on visibilitychange/pagehide.
**How to avoid:** `web-vitals` handles this — its callbacks deliver the final value (and support `reportAllChanges` if you want updates). Use defaults; do not roll your own observer. For validation, read GA4 over a session, not a single pageview.

## Code Examples

### §1 Consent default stub + GA4 loader (mount in `[lang]/layout.tsx`)
```tsx
// Source: developers.google.com/tag-platform/security/guides/consent (ordering + snippets)
//         + node_modules/next/dist/docs/.../script.md (strategy semantics)
// src/components/Analytics.tsx  — "use client" not required for <Script>, but env read is fine in server component
import Script from "next/script";

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null; // no-op build when unset (D-01)
  return (
    <>
      {/* 1) consent default DENIED — must run before gtag.js (Pattern 1) */}
      <Script id="consent-default" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
          gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});`}
      </Script>
      {/* 2) GA4 loader */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-config" strategy="afterInteractive">
        {`gtag('js', new Date()); gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}
```
> Verify `beforeInteractive` placement is accepted in `[lang]/layout.tsx` for this build; if Next complains it must be in the *root* layout, fall back to an inline `<script dangerouslySetInnerHTML>` for the stub (same effect).

### §2 Guarded track() helper
```ts
// src/lib/analytics.ts  [ASSUMED payload shape — Claude's discretion D-04 area]
declare global { interface Window { gtag?: (...args: unknown[]) => void } }
export type GaEvent = "phone_click" | "book_cta_click" | "generate_lead" | "web_vitals";
export function track(event: GaEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;          // GA unset / not loaded
  window.gtag("event", event, params);
}
export function grantConsent(): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("consent", "update", { analytics_storage: "granted" });
  }
}
```

### §3 web-vitals → GA4 (consent-gated)
```tsx
// Source: github.com/GoogleChrome/web-vitals README (v5 API)
// src/components/WebVitalsReporter.tsx
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
> `Metric.rating` ('good'|'needs-improvement'|'poor') and `Metric.id` are provided by web-vitals v5 `[CITED: github.com/GoogleChrome/web-vitals]`.

### §4 Event wrapper that does NOT touch Button.tsx
```tsx
// src/components/StickyCtaBar.tsx (excerpt) — "use client"
"use client";
import { Button } from "./Button";
import { track } from "@/lib/analytics";
import { site } from "@/lib/site";
// ... bar shell: bg-espresso, fixed bottom, z-40, md:hidden, RTL-aware ...
<span onClick={() => track("phone_click")}>
  <Button href={site.contact.phoneHref} variant="light" className="flex-1 min-h-[44px]">{dict.cta.callNow}</Button>
</span>
<span onClick={() => track("book_cta_click")}>
  <Button href={`/${locale}${site.booking}`} variant="light" className="flex-1 min-h-[44px]">{dict.cta.book}</Button>
</span>
```
> A wrapping `<span onClick>` is the minimal interception; the click still reaches the `<a>` for `tel:`/navigation. (Add `role`/keyboard handling if the wrapper ever needs to be focusable — here the inner `<a>` carries semantics, so the span is decorative.)

### §5 generate_lead in ContactForm success branch
```ts
// src/components/ContactForm.tsx — inside handleSubmit, after setStatus("success") (verified ~line 35)
setStatus("success");
track("generate_lead", { method: "contact_form" });
form.reset();
```

### §6 AI-referrer GA4 custom channel-group regex (user pastes into GA4 console)
```
# GA4 Admin → Data display → Channel groups → New channel group → New channel
# Condition: Source matches regex   (recommended)  — also add a Referral/medium guard if needed.
# Channel name: "AI Assistants"
^(chatgpt\.com|chat\.openai\.com|perplexity\.ai|www\.perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|www\.bing\.com/chat|.*\.bing\.com)$
```
```
# Alternative — match on "Session source" OR "Session referrer" containing any AI host:
.*(chatgpt|openai|perplexity|claude\.ai|gemini\.google|copilot\.microsoft|bing\.com/chat).*
```
> `[ASSUMED]` — exact GA4 referrer/source tokens for each AI engine vary (some arrive as `chatgpt.com`, some as `chat.openai.com`; Copilot may surface as `copilot.microsoft.com` or via `bing.com`). The user must validate against GA4 Realtime → Acquisition after the first AI-referred sessions land, and refine. This is the **no-backfill** item: create the channel group **before** deploying Phase 2 content to live traffic (D-03, STATE.md blocker).

### §7 Bundle analyzer wrapping (next.config.ts)
```ts
// next.config.ts — wrap existing export
import bundleAnalyzer from "@next/bundle-analyzer";
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
// ... existing nextConfig ...
export default withBundleAnalyzer(nextConfig);
```
Add a script: `"analyze": "ANALYZE=true next build"` (or run `ANALYZE=true bun run build`).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FID as a Core Web Vital | **INP** replaced FID | Mar 2024 (CWV); web-vitals v4→v5 removed `onFID` | Use `onINP`, not `onFID`. Success criteria already specify INP. |
| Consent Mode v1 | **Consent Mode v2** (`ad_user_data`, `ad_personalization` added) | 2024 (mandatory for EEA ads; good practice generally) | Default-denied stub includes all four signals even though only `analytics_storage` is toggled (analytics-only site). |
| `gtag.js` via raw `<script>` in `_document` | `next/script` in App Router root layout | Next 13+ App Router | Use `next/script` in `[lang]/layout.tsx`. |
| GA4 native "AI Assistant" channel (limited) | **Custom channel group** for fuller AI-referrer coverage | 2024–2025 | MEAS-01 explicitly wants the custom group beyond GA4's native channel. |

**Deprecated/outdated:**
- `onFID` / FID — gone in web-vitals v5; INP is the metric.
- `@next/third-parties GoogleAnalytics` for this use — convenient but does not give Consent-Mode-default ordering control (see Alternatives). `[ASSUMED]` pending verification if planner wants to reconsider.

## Runtime State Inventory

> Not a rename/refactor/migration phase. This is additive instrumentation. Section included for completeness of the no-backfill external-state concern.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastore stores analytics keys. `ss_consent` cookie is new (client-set). | None |
| Live service config | **GA4 property + AI-referrer custom channel group** live in the GA4 console (NOT in git). Channel group **does not backfill**. | **Manual (user):** create GA4 property, create channel group **before** live traffic; paste regex from §6. Set `NEXT_PUBLIC_GA_ID` in Dokploy. |
| OS-registered state | None | None |
| Secrets/env vars | `NEXT_PUBLIC_GA_ID` (new, Dokploy runtime/build secret). Pattern matches existing `GSC_VERIFICATION`/`BING_VERIFICATION` env reads in `[lang]/layout.tsx`. | **Set in Dokploy.** Confirm available at **build** time (NEXT_PUBLIC vars inline at build) — see Open Question 2. |
| Build artifacts | `.next/standalone` Docker output; `@next/bundle-analyzer` emits `.next/analyze/*.html` (gitignore it). | Add `.next/analyze` to `.gitignore` if not covered. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node/bun toolchain | build/install | ✓ | repo uses bun + npm lockfile | — |
| `web-vitals` | MEAS-04 RUM | ✗ (not installed) | install 5.3.0 | none — required |
| `@next/bundle-analyzer` | MEAS-04 D-11 audit | ✗ (not installed) | install 16.2.9 | none — required for evidence-first audit |
| GA4 property + measurement ID | MEAS-01/02/04 | ✗ (user must create; no `NEXT_PUBLIC_GA_ID` in repo) | — | Build no-ops without ID (D-01); but events/RUM/channel cannot be verified until set |
| GA4 console access (for channel group) | MEAS-01 | user-only (Claude cannot reach GA4 admin) | — | none — user pastes regex |
| Dokploy env config | MEAS-01 | ✓ (existing deploy pipeline) | — | — |

**Missing dependencies with no fallback:**
- GA4 property + `NEXT_PUBLIC_GA_ID` (user action) — without it, success criteria 1, 2, 4 (Realtime verification) cannot be demonstrated. Code can still ship no-op.
- `web-vitals`, `@next/bundle-analyzer` — must be installed (gated behind human-verify per legitimacy audit, expected trivial).

**Missing dependencies with fallback:**
- None.

## Project Constraints (from CLAUDE.md / AGENTS.md)

- **AGENTS.md:** This is a **custom Next.js build** — read `node_modules/next/dist/docs/` before asserting any Next API. ✅ Done: `script.md` read in-session; `next/script` strategies confirmed for Next 16.2.6.
- **PROJECT.md constraints (per CONTEXT canonical refs):** Law 25 (consent default-denied — drives Pattern 1); no-backfill (channel group before live traffic); SSR rule (trust band SSR-visible, not opacity-0); Dokploy runtime secrets (`NEXT_PUBLIC_GA_ID` out of git).
- **Global CLAUDE.md:** Immutability (new objects, no mutation); many small files (<800 lines); validate at boundaries; no hardcoded secrets/values; surgical changes (Rule 3 — no speculative Framer refactor, D-11); match codebase conventions (dictionary single-source, no hardcoded copy).
- **Standalone-route ↔ proxy coupling:** N/A this phase — no new non-`[lang]` route added (CONTEXT crawl-coupling note). Do not re-raise.
- **CSP:** Intentionally not set yet (next.config note + REQUIREMENTS out-of-scope). Adding GA4 means a future CSP must allowlist `www.googletagmanager.com` (script-src) and `www.google-analytics.com`/`region1.google-analytics.com` (connect-src). Out of scope now, but note for the CSP follow-up.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | AI-referrer regex tokens (chatgpt.com vs chat.openai.com, Copilot via bing) | Code §6, Open Q1 | Channel group misses or over-captures some AI sources; user must refine in GA4 against real Realtime data |
| A2 | `@next/third-parties GoogleAnalytics` lacks Consent-Mode default ordering control | Alternatives / State of the Art | If wrong, a simpler component could be used — but `next/script` approach is safe regardless |
| A3 | GA4 event param/payload shapes (`metric_name`, `method`, etc.) | Code §2–5 | Wrong param names → GA4 reports under unexpected keys; cosmetic, fixable in console (Claude's discretion D-04 area) |
| A4 | `beforeInteractive` is accepted in `[lang]/layout.tsx` (vs requiring the true root) | Pattern 1, Code §1 | If rejected, fall back to inline `<script>` stub — documented fallback, low risk |
| A5 | `NEXT_PUBLIC_GA_ID` is available at **build** time in Dokploy (not only runtime) | Pattern 2, Open Q2 | If only runtime, static pages won't inline the ID; may need a runtime injection strategy |
| A6 | `@next/bundle-analyzer` produces a usable treemap under Next 16 Turbopack build | Pattern 5, Open Q3 | If analyzer needs webpack build, run `next build` without `--turbopack` for the analyze run |

## Open Questions

1. **Exact AI-referrer source/referrer tokens in GA4 for each engine.**
   - What we know: ChatGPT, Perplexity, Claude, Gemini, Copilot refer traffic; tokens vary (chatgpt.com / chat.openai.com; copilot.microsoft.com / bing).
   - What's unclear: precise `Session source`/`Session referrer` values GA4 records for each, which the regex must match.
   - Recommendation: ship a best-effort regex (§6), then have the user validate in GA4 Realtime → Acquisition after first AI-referred sessions and refine. Create channel **before** deploy (no backfill).

2. **Is `NEXT_PUBLIC_GA_ID` provided at build time by Dokploy?**
   - What we know: existing env reads (`GSC_VERIFICATION`) work; `NEXT_PUBLIC_` vars inline at build for static pages; the app is `output: "standalone"` Docker.
   - What's unclear: whether Dokploy injects the var into the build stage or only the runtime stage.
   - Recommendation: planner verifies the Dokploy build env includes `NEXT_PUBLIC_GA_ID`; if runtime-only, evaluate a runtime config read (the `Analytics` component reading the var works at request time for dynamically-rendered pages, but home/services are statically generated — confirm).

3. **Does `@next/bundle-analyzer` emit a treemap under this Turbopack/Next 16 build?**
   - What we know: analyzer is webpack-stats based; repo pins `turbopack.root`.
   - What's unclear: whether `ANALYZE=true next build` (default builder in Next 16) produces the report.
   - Recommendation: try `ANALYZE=true bun run build`; if no report, run the analyze pass with the webpack builder (omit `--turbopack`). Success criterion 4 requires this to work.

4. **Consent bar vs sticky CTA bar double-stacking on first mobile visit.**
   - What we know: UI-SPEC prefers suppressing the sticky CTA bar while the consent cookie is absent (line 200).
   - What's unclear: nothing blocking — just confirm the planner adopts "hide CTA bar until consent recorded" to avoid two bottom bars.
   - Recommendation: gate StickyCtaBar render on `ss_consent` presence (cookie set, either value) — matches UI-SPEC.

## Security Domain

> `security_enforcement` not explicitly false in config.json → enabled. Scoped to this phase's surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in this phase |
| V3 Session Management | no | `ss_consent` is a non-auth preference cookie (SameSite=Lax, non-sensitive) |
| V4 Access Control | no | No protected resources added |
| V5 Input Validation | partial | No new user input fields; `ContactForm` validation unchanged (Zod at `/api/contact`). web-vitals values are numeric, formatted before send. |
| V6 Cryptography | no | No secrets handled client-side; `NEXT_PUBLIC_GA_ID` is a public measurement ID by design |
| V7 Error handling/logging | yes | `track()` fails silently (no PII leak); no console.log in production (global rule) |
| V14 Config | yes | GA ID via env (out of git); future CSP must allowlist GA origins (noted, out of scope) |

### Known Threat Patterns for GA4 + client analytics
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Inline consent stub as XSS sink | Tampering/Injection | Stub is a static literal — no interpolation of user data. Only `${gaId}` (env, server-controlled) is interpolated; validate it matches `^G-[A-Z0-9]+$` before injection. |
| PII in analytics events | Info Disclosure | Send only event names + numeric CWV + non-PII params (`method: "contact_form"`). Never send form field values, email, or phone. |
| Consent bypass / pre-consent tracking | Privacy (Law 25) | Default-denied stub (Pattern 1) + guarded `track()` (consent gate). Verify in GA4 DebugView no hits before Accept. |
| Tracking when GA unset | — | `track()` guard + null-render loader → no-op. |
| `NEXT_PUBLIC_GA_ID` leakage | Info Disclosure | Non-issue — measurement IDs are public by design; the secret-management concern does NOT apply. Do not treat it as a secret beyond keeping it out of git for env hygiene. |

> **Validation Architecture section omitted:** `workflow.nyquist_validation` is not present and config shows no test-gating workflow; the repo uses Vitest (`*.test.ts(x)`) ad hoc. Existing test patterns (`page.test.tsx`, `proxy.test.ts`, `seo.test.ts`) cover SSR-output assertions — the planner can add SSR-visibility tests (trust band present, consent bar absent in SSR HTML) following the existing `page.test.tsx` style and the UI-SPEC SSR Verification Contract (lines 386–394).

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md` — `next/script` strategies (`beforeInteractive`/`afterInteractive`), `onLoad`/`onReady` constraints, App Router root-layout placement rule (Next 16.2.6, in-repo)
- `node_modules/next/dist/docs/01-app/02-guides/scripts.md` — layout vs app-wide script loading, dedup behavior
- In-session codebase reads: `src/app/[lang]/layout.tsx`, `Button.tsx`, `ContactForm.tsx`, `Header.tsx`, `Stars.tsx`, `Reveal.tsx`, `site.ts`, `i18n.ts`, `dictionaries.ts`, `dictionary.ts`, `reviews.ts`, `next.config.ts`, `LocaleSwitch.tsx` (cookie pattern), home `page.tsx`
- npm registry (in-session): `web-vitals@5.3.0`, `@next/bundle-analyzer@16.2.9`, postinstall=null on both
- `gsd-tools query package-legitimacy check` — verdicts (both SUS/too-new with authoritative repos + high downloads)

### Secondary (MEDIUM confidence)
- developers.google.com/tag-platform/security/guides/consent — Consent Mode v2 ordering ("consent code out of order → defaults won't work") + default/update snippets `[CITED]`
- github.com/GoogleChrome/web-vitals — v5 API `onLCP/onINP/onCLS`, `Metric` shape (`name`/`value`/`rating`/`id`) `[CITED]`

### Tertiary (LOW confidence)
- AI-referrer regex tokens (§6) — `[ASSUMED]`; user must validate against live GA4 Realtime
- `@next/third-parties` ordering limitation — `[ASSUMED]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified on registry; Next API verified in in-repo docs
- Architecture: HIGH — layout structure, component boundaries, cookie patterns all verified in codebase
- Consent ordering: HIGH — cited from Google official docs + Next script.md
- Pitfalls: HIGH — derived from verified codebase facts (no shared key-page layout; existing Framer usages; existing SSR-visibility decisions)
- AI-referrer regex: LOW — assumed tokens, user-refined in console
- Env/build timing (Dokploy, Turbopack analyzer): MEDIUM — flagged as Open Questions for planner verification

**Research date:** 2026-06-18
**Valid until:** 2026-07-18 (stable domain; recheck `web-vitals`/`@next/bundle-analyzer` versions and GA4 channel-group UI if planning slips past ~30 days)
