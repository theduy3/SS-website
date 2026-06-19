---
phase: 03-measurement-conversion
plan: "01"
subsystem: analytics
tags: [ga4, consent-mode-v2, gdpr, law25, cookie-consent, tracking]
dependency_graph:
  requires: []
  provides:
    - src/lib/analytics.ts (track, grantConsent, GaEvent)
    - src/lib/consent.ts (readConsent, writeConsent, SS_CONSENT_COOKIE)
    - src/components/Analytics.tsx (Consent Mode v2 stub + GA4 loader)
    - src/components/ConsentBar.tsx (JS-mounted Accept/Decline bar)
    - src/lib/site.ts#established
    - src/dictionaries/{en,fr,es,ar}.json#consent namespace
  affects:
    - src/app/[lang]/layout.tsx (mounts Analytics + ConsentBar)
tech_stack:
  added:
    - next/script (beforeInteractive consent stub, afterInteractive GA4 loader)
    - useSyncExternalStore hydration gate (ConsentBar SSR exclusion)
  patterns:
    - Consent Mode v2 default-denied ordering (stub → loader)
    - useSyncExternalStore hydration gate (from Reveal.tsx pattern)
    - Cookie write via document.cookie string (from LocaleSwitch.tsx pattern)
    - Server cookie read via next/headers cookies() (from session.ts pattern)
key_files:
  created:
    - src/lib/analytics.ts
    - src/lib/analytics.test.ts
    - src/lib/consent.ts
    - src/components/Analytics.tsx
    - src/components/ConsentBar.tsx
    - src/components/ConsentBar.test.tsx
  modified:
    - src/lib/site.ts
    - src/app/[lang]/layout.tsx
    - src/dictionaries/en.json
    - src/dictionaries/fr.json
    - src/dictionaries/es.json
    - src/dictionaries/ar.json
decisions:
  - "Consent-default-denied stub uses strategy=beforeInteractive (next/script App Router) so it executes before gtag.js regardless of page route — confirmed against node_modules/next/dist/docs script.md"
  - "ConsentBar uses useSyncExternalStore hydration gate (not useState+useEffect) so bar is provably absent from SSR HTML — identical to Reveal.tsx pattern"
  - "GA id validated against anchored /^G-[A-Z0-9-]+$/ before interpolation into inline script — prevents T-03-01 injection sink"
  - "writeConsent uses SameSite=Lax, no Secure flag — non-sensitive preference value per UI-SPEC line 176"
  - "ConsentBar RTL support via flex-row-reverse on md: row layout when dirFor(locale)==='rtl'"
metrics:
  duration: "~7 minutes"
  completed: "2026-06-19"
  tasks_completed: 3
  files_created: 6
  files_modified: 6
  tests_added: 10
status: complete
---

# Phase 03 Plan 01: GA4 Analytics + Consent Mode v2 Spine Summary

**One-liner:** GA4 Consent Mode v2 default-denied pipeline with a 4-locale JS-mounted Accept/Decline consent bar, guarded `track()`/`grantConsent()` helpers, `ss_consent` cookie SSR-read, and `site.established: 2024`.

## What Was Built

The complete measurement spine required before any new page ships to live traffic:

1. **`src/lib/analytics.ts`** — `GaEvent` union type, `track(event, params?)` and `grantConsent()` helpers. Both guard on `typeof window === "undefined"` then `typeof window.gtag !== "function"` and no-op safely. No PII in any payload.

2. **`src/lib/consent.ts`** — `SS_CONSENT_COOKIE` constant, server `readConsent()` (uses `cookies()` from `next/headers`), client `writeConsent(value)` (SameSite=Lax, no Secure flag per UI-SPEC).

3. **`src/components/Analytics.tsx`** — env-gated (returns `null` when `NEXT_PUBLIC_GA_ID` unset). GA id validated against `/^G-[A-Z0-9-]+$/` before interpolation (T-03-01). Emits two ordered script blocks: (1) consent-default-denied stub at `strategy="beforeInteractive"`, (2) GA4 loader + config at `strategy="afterInteractive"`. Ordering is the load-bearing Consent Mode v2 gate.

4. **`src/components/ConsentBar.tsx`** — `"use client"`, `useSyncExternalStore` hydration gate so bar is absent from SSR HTML. Native `<button type="button">` (no Button.tsx import). Accept: `writeConsent("granted")` → `grantConsent()` → unmount. Decline: `writeConsent("denied")` → unmount (no grantConsent). RTL support via `flex-row-reverse` for Arabic locale.

5. **`src/lib/site.ts`** — `established: 2024` added as a new field on the `site` object (feeds Trust Band in plan 03-02).

6. **4-locale consent copy** (`en/fr/es/ar`) — `consent.{body,accept,decline,ariaLabel}` added to all 4 dictionaries per UI-SPEC lines 267–272 exact copy. `en.json` is the Dictionary type source so TypeScript validates the shape across all locales.

7. **`src/app/[lang]/layout.tsx`** — imports and mounts `<Analytics />` and `<ConsentBar />`. SSR reads `readConsent()` → derives `consentKnown` prop. TrustBand and StickyCtaBar are NOT mounted here (plan 03-02 per-page only).

## Test Coverage

| File | Tests | Result |
|------|-------|--------|
| `src/lib/analytics.test.ts` | 5 (TDD RED→GREEN) | PASS |
| `src/components/ConsentBar.test.tsx` | 5 (TDD RED→GREEN) | PASS |
| Full suite | 103 / 18 files | PASS |

## Verification Results

- `bun run tsc --noEmit` exits 0 (no type errors)
- `bun run test src/components/ConsentBar.test.tsx` — 5/5 pass
- `bun run test src/lib/analytics.test.ts` — 5/5 pass
- All 4 locale consent keys present (node -e check passes for en/fr/es/ar)
- `Analytics.tsx` emits `strategy="beforeInteractive"` stub before `strategy="afterInteractive"` loader in source order
- `site.ts` contains `established: 2024` (one match)
- `[lang]/layout.tsx` mounts `<Analytics />` and `<ConsentBar />`, reads `readConsent()`, NO TrustBand or StickyCtaBar

## Runtime Verification (post-deploy with GA id set)

These must be validated by the user after setting `NEXT_PUBLIC_GA_ID` in Dokploy:
- GA4 DebugView shows NO hits before Accept click (analytics_storage=denied)
- `analytics_storage` reads `granted` only after Accept
- `curl .../en/ | grep -i "accept\|decline"` returns no bar markup (SSR exclusion confirmed)
- No-op build: `curl .../en/` without GA id set shows no `googletagmanager.com/gtag/js`

## User Setup Required (non-blocking for code deploy)

1. **Set `NEXT_PUBLIC_GA_ID`** in Dokploy at BUILD time (`G-XXXXXXX` format from GA4 Admin → Data streams → Web stream → Measurement ID)
2. **Create AI Assistants channel group** in GA4 Admin → Data display → Channel groups → New channel group — BEFORE live traffic (no backfill). Use regex: `.*(chatgpt|openai|perplexity|claude\.ai|gemini\.google|copilot\.microsoft|bing\.com/chat).*`
3. **Flag Key events** in GA4 Admin → Events → Key events: `generate_lead`, `phone_click`, `book_cta_click` (wired in plan 03-02)

## Deviations from Plan

None — plan executed exactly as written. All three tasks completed in sequence with TDD RED→GREEN cycles for Tasks 1 and 3.

## Known Stubs

None. All artifacts are fully wired with no placeholder values or hardcoded empty data flowing to UI.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: network-egress | src/components/Analytics.tsx | GA4 loader fetches `googletagmanager.com/gtag/js` — this is the intended measurement endpoint. Mitigated: T-03-01 (id validation), T-03-03 (consent-default-denied ordering), T-03-02 (no PII in payloads). Covered in plan threat model. |

## Self-Check: PASSED
