---
phase: 03-measurement-conversion
plan: "02"
subsystem: conversion
tags: [trust-band, sticky-cta, ga4-events, phone-click, book-cta-click, generate-lead, ssr, consent-gate]
dependency_graph:
  requires:
    - src/lib/analytics.ts (track, GaEvent — from 03-01)
    - src/lib/consent.ts (readConsent — from 03-01)
    - src/lib/reviews.ts (reviewsFetchedAt — live-data gate)
    - src/lib/site.ts (site.established, site.contact.phoneHref, site.booking)
  provides:
    - src/components/Stars.tsx#size-prop
    - src/components/TrustBand.tsx (SSR trust band, live-gated)
    - src/components/StickyCtaBar.tsx (client mobile sticky bar)
    - src/components/KeyPageChrome.tsx (server wrapper — one import per key page)
    - src/components/ContactForm.tsx#generate_lead
    - src/dictionaries/{en,fr,es,ar}.json#trust namespace
  affects:
    - src/app/[lang]/page.tsx (home — KeyPageChrome mounted)
    - src/app/[lang]/services/page.tsx (KeyPageChrome mounted)
    - src/app/[lang]/services/[slug]/page.tsx (KeyPageChrome mounted)
    - src/app/[lang]/faq/page.tsx (KeyPageChrome mounted)
    - src/app/[lang]/laval/page.tsx (KeyPageChrome mounted)
tech_stack:
  added: []
  patterns:
    - reviewsFetchedAt live-data gate (mirror of seo.ts:163-169 pattern)
    - span-onClick-wrapper around Button (D-06 ban: Button.tsx never receives onClick)
    - consentKnown suppression (StickyCtaBar hidden until ss_consent cookie present)
    - localizedHref pattern copied from Header.tsx:32-33
    - dirFor(locale)==="rtl" flex-row-reverse for Arabic button order
key_files:
  created:
    - src/components/TrustBand.tsx
    - src/components/TrustBand.test.tsx
    - src/components/StickyCtaBar.tsx
    - src/components/KeyPageChrome.tsx
  modified:
    - src/components/Stars.tsx (size prop added)
    - src/components/ContactForm.tsx (generate_lead track call)
    - src/dictionaries/en.json (trust namespace)
    - src/dictionaries/fr.json (trust namespace)
    - src/dictionaries/es.json (trust namespace)
    - src/dictionaries/ar.json (trust namespace)
    - src/app/[lang]/page.tsx (KeyPageChrome + readConsent + pb-[64px])
    - src/app/[lang]/services/page.tsx (KeyPageChrome + readConsent + pb-[64px])
    - src/app/[lang]/services/[slug]/page.tsx (KeyPageChrome + readConsent + pb-[64px])
    - src/app/[lang]/faq/page.tsx (KeyPageChrome + readConsent + pb-[64px])
    - src/app/[lang]/laval/page.tsx (KeyPageChrome + readConsent + pb-[64px])
decisions:
  - "Stars size prop defaults to h-6 w-6 to preserve all existing call sites; trust band passes size=h-4 w-4 for compact variant"
  - "StickyCtaBar suppressed when consentKnown=false (consent cookie absent) to avoid double-bar stacking with ConsentBar (UI-SPEC line 200)"
  - "KeyPageChrome is a server component even though it renders a client child (StickyCtaBar) — Next.js composes them correctly"
  - "TrustBand reads reviewsFetchedAt directly from @/lib/reviews (not via prop) — consistent with seo.ts gate pattern"
  - "generate_lead fires after setStatus(success) and before form.reset() — success is confirmed before event fires"
  - "pb-[64px] md:pb-0 applied to outermost page wrapper div (replacing fragment) so padding applies to all content including dynamic sections"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-19"
  tasks_completed: 3
  files_created: 4
  files_modified: 11
  tests_added: 6
status: complete
---

# Phase 03 Plan 02: Trust Band + Sticky CTA + Conversion Events Summary

**One-liner:** SSR trust band (live-gated rating + static "Since 2024"), mobile sticky Call+Book bar firing `phone_click`/`book_cta_click` via `<span onClick>` wrappers, and `generate_lead` in ContactForm success — mounted on exactly 5 key pages via single `KeyPageChrome` import.

## What Was Built

The complete conversion + trust vertical slice (MEAS-02 + MEAS-03):

1. **`src/components/Stars.tsx`** — Added `size` prop (default `"h-6 w-6"`) applied to the `<svg>` className. All 10 existing call sites preserve default sizing. Trust band passes `size="h-4 w-4"` for the compact variant.

2. **`src/components/TrustBand.tsx`** — SSR server component (no `"use client"`). Live-gates the rating block on `reviewsFetchedAt` (mirrors `seo.ts:163-169`). When truthy: renders Stars (`size="h-4 w-4"`), rating number (locale-formatted via `toLocaleString`), separator, reviewCount + `dict.trust.reviewsWord`, separator, `dict.trust.established`. When null: renders `dict.trust.established` only — no placeholder rating. NOT wrapped in `<Reveal>`. No `new Date()`. Locale tag maps all 4 locales (en-CA, fr-CA, es, ar-SA).

3. **`src/components/StickyCtaBar.tsx`** — `"use client"`, `md:hidden`, `fixed bottom-0 left-0 right-0 z-40 bg-espresso`. Suppressed when `consentKnown === false`. Two CTAs as `<span onClick>` wrappers around `Button` (Button.tsx unchanged). Call fires `track("phone_click")` → `site.contact.phoneHref`. Book fires `track("book_cta_click")` → `localizedHref(site.booking)`. RTL: `flex-row-reverse` for Arabic locale. No animation.

4. **`src/components/KeyPageChrome.tsx`** — Server component composing `TrustBand` + `StickyCtaBar`. Single import per key page. NOT mounted in `[lang]/layout.tsx` (D-09).

5. **`src/components/ContactForm.tsx`** — Added `import { track } from "@/lib/analytics"` and `track("generate_lead", { method: "contact_form" })` immediately after `setStatus("success")`. Sends only `method` — no PII field values (T-03-05).

6. **4-locale dictionaries** — `trust.established` + `trust.reviewsWord` added to en/fr/es/ar per UI-SPEC lines 276-279. All 4 locales already had `cta.callNow` and `cta.book` (verified).

7. **5 key pages** — `home`, `services`, `services/[slug]`, `faq`, `laval` each: import `KeyPageChrome` + `readConsent`; derive `consentKnown = consent !== undefined`; mount `<KeyPageChrome locale dict consentKnown />`; wrap outermost JSX in `<div className="pb-[64px] md:pb-0">`. `contact` and `appointments` pages untouched.

## Test Coverage

| File | Tests | Result |
|------|-------|--------|
| `src/components/TrustBand.test.tsx` | 6 (live-data gate × 3, no-data gate × 3) | PASS |
| Full suite (19 files) | 109 / 19 files | PASS |

## Verification Results

- `bun run tsc --noEmit` exits 0 (no type errors)
- `bun run test` — 109/109 pass, 19 test files
- `Stars.tsx` accepts `size` prop; svg no longer hardcodes `h-6 w-6`
- `TrustBand.tsx`: no `"use client"`, no `<Reveal>`, no `new Date()`, `reviewsFetchedAt` gate present
- `StickyCtaBar.tsx`: `track("phone_click")` + `track("book_cta_click")` via `<span onClick>`, `md:hidden`, `site.contact.phoneHref`, `localizedHref(site.booking)`
- `Button.tsx`: 0 `onClick` occurrences (ban holds)
- `ContactForm.tsx`: `track("generate_lead"` present (1 match)
- All 4 dictionaries: `trust.established` + `trust.reviewsWord` + `cta.callNow` + `cta.book` present
- `KeyPageChrome` on all 5 key pages (import + usage = 2 grep matches each)
- `pb-[64px]` on all 5 key pages (1 match each)
- `KeyPageChrome` absent from `contact/page.tsx` and `appointments/page.tsx` (0 matches)

## Runtime Verification (post-deploy)

These must be validated after deploy:

- `curl .../en/ | grep -i "since 2024"` returns text before `</body>` (TrustBand SSR)
- `curl .../en/contact | grep -i "since 2024"` returns no match (not on contact page)
- Mobile viewport (375px): sticky bar visible at bottom of key pages; absent on contact/appointments
- GA4 Realtime: `phone_click`, `book_cta_click`, `generate_lead` appear after consent granted

## Deviations from Plan

None — plan executed exactly as written. All three tasks completed in sequence.

## Known Stubs

None. All components are fully wired:
- TrustBand reads live `reviewsFetchedAt` from `@/lib/reviews` (shows "Since 2024" only until first fetch — this is correct intentional behavior per UI-SPEC, not a stub)
- StickyCtaBar fires real `track()` calls through the guarded analytics helper
- ContactForm fires `generate_lead` on real form success

## Threat Flags

No new threat surface beyond plan's threat model:

| Flag | File | Description |
|------|------|-------------|
| threat_flag: client-egress | src/components/StickyCtaBar.tsx | `phone_click` / `book_cta_click` events leave the browser via guarded `track()`. Mitigated: T-03-06 (span wrapper — navigation proceeds if track() no-ops), T-03-07 (consent-gated, bar suppressed pre-consent). |
| threat_flag: client-egress | src/components/ContactForm.tsx | `generate_lead` event leaves the browser on form success. Mitigated: T-03-05 (only `{method:"contact_form"}` sent, no PII). |

## Self-Check: PASSED
