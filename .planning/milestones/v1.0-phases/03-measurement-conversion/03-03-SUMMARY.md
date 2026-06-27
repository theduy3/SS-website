---
phase: 03-measurement-conversion
plan: "03"
subsystem: analytics
tags: [web-vitals, core-web-vitals, bundle-analyzer, consent-gate, ga4, law25, rum]
dependency_graph:
  requires:
    - src/lib/analytics.ts (track, GaEvent — from 03-01)
    - src/lib/consent.server.ts (readConsent — split from consent.ts, this plan)
    - src/app/[lang]/layout.tsx (SSR consent read — from 03-01)
  provides:
    - src/components/WebVitalsReporter.tsx (consent-gated onLCP/onINP/onCLS → track)
    - src/lib/consent.server.ts (server-only readConsent, split from consent.ts)
    - .next/analyze/{client,nodejs,edge}.html (bundle treemap, ANALYZE=true --webpack)
  affects:
    - src/app/[lang]/layout.tsx (mounts WebVitalsReporter with consentGranted prop)
    - src/lib/consent.ts (removed next/headers import; now client-safe only)
    - src/app/[lang]/page.tsx (import updated to consent.server)
    - src/app/[lang]/faq/page.tsx (import updated to consent.server)
    - src/app/[lang]/laval/page.tsx (import updated to consent.server)
    - src/app/[lang]/services/page.tsx (import updated to consent.server)
    - src/app/[lang]/services/[slug]/page.tsx (import updated to consent.server)
tech_stack:
  added:
    - web-vitals@5.3.0 (dep) — onLCP/onINP/onCLS v5 API; no onFID
    - "@next/bundle-analyzer@16.2.9" (devDep) — webpack-stats treemap under ANALYZE=true
  patterns:
    - consent-gated useEffect (same as ConsentBar pattern; no-op when consentGranted=false)
    - server/client module split (consent.ts client-safe + consent.server.ts server-only)
    - vi.hoisted() for mock initialization order in Vitest
key_files:
  created:
    - src/components/WebVitalsReporter.tsx
    - src/components/WebVitalsReporter.test.tsx
    - src/lib/consent.server.ts
  modified:
    - package.json (web-vitals dep, @next/bundle-analyzer devDep, analyze script)
    - bun.lock
    - next.config.ts (withBundleAnalyzer wrap)
    - src/lib/consent.ts (removed next/headers; now client-safe only)
    - src/app/[lang]/layout.tsx (WebVitalsReporter import + mount + consentGranted)
    - src/app/[lang]/page.tsx
    - src/app/[lang]/faq/page.tsx
    - src/app/[lang]/laval/page.tsx
    - src/app/[lang]/services/page.tsx
    - src/app/[lang]/services/[slug]/page.tsx
decisions:
  - "analyze script uses --webpack flag (ANALYZE=true next build --webpack): Turbopack does not emit webpack-stats treemap (Open Q3/A6 from RESEARCH). Normal bun run build continues to use Turbopack unaffected."
  - "consent.ts split into consent.ts (client-safe: writeConsent, SS_CONSENT_COOKIE) + consent.server.ts (server-only: readConsent via next/headers) — pre-existing Turbopack client-boundary violation from 03-02 blocked all builds; Rule 1 auto-fix."
  - "vi.hoisted() used in test for mock initialization: Vitest hoists vi.mock() factories before const declarations, causing 'cannot access before init' errors when mocks reference module-level const variables."
  - "D-11 finding: framer-motion appears once each in client + nodejs bundles (single shared chunk). No duplication — refactor is NOT needed per plan conditional (Rule 3 scope boundary honored)."
metrics:
  duration: "~9 minutes"
  completed: "2026-06-19"
  tasks_completed: 2
  files_created: 3
  files_modified: 11
  tests_added: 6
status: complete
---

# Phase 03 Plan 03: RUM + Bundle Budget Summary

**One-liner:** Consent-gated Web Vitals RUM (onLCP/onINP/onCLS → GA4 `web_vitals` events via `track()`) with `@next/bundle-analyzer` treemap gated on `ANALYZE=true --webpack`; pre-existing `consent.ts` client-boundary build failure fixed by server/client module split.

## What Was Built

### Package-legitimacy checkpoint (T-03-SC)

Pre-approved by human before execution. Both packages confirmed legitimate:
- `web-vitals@5.3.0` — GoogleChrome org, millions of weekly downloads, no postinstall script.
- `@next/bundle-analyzer@16.2.9` — vercel/next.js first-party, tracks Next 16.2.x line, no postinstall script.

### Task 1: Install + bundle-analyzer config

1. **`web-vitals@5.3.0`** installed as runtime dependency (`bun add web-vitals`).
2. **`@next/bundle-analyzer@16.2.9`** installed as devDependency (`bun add -d @next/bundle-analyzer`).
3. **`next.config.ts`** wrapped: `export default withBundleAnalyzer(nextConfig)` gated on `process.env.ANALYZE === "true"`. Existing `securityHeaders`, `output: "standalone"`, `turbopack.root`, `images` config preserved.
4. **`package.json`** `analyze` script: `"ANALYZE=true next build --webpack"` (see Decisions for `--webpack` rationale).
5. **[Rule 1 auto-fix]** `consent.ts` split — see Deviations.

**Analyze build result:** `ANALYZE=true bun run build --webpack` exits 0 and emits `.next/analyze/client.html`, `.next/analyze/nodejs.html`, `.next/analyze/edge.html`.

**D-11 framer-motion finding:** framer-motion appears once each in client and nodejs bundles — single shared chunk, no duplication. Conditional refactor (plan D-11) is NOT needed.

### Task 2: WebVitalsReporter + layout mount (TDD RED→GREEN)

1. **`src/components/WebVitalsReporter.tsx`** — `"use client"` component. `useEffect` keyed on `consentGranted`:
   - `consentGranted=false` → returns immediately; zero listeners registered; zero `track()` calls.
   - `consentGranted=true` → imports and registers `onLCP`, `onINP`, `onCLS` (web-vitals v5). Each metric fires `track("web_vitals", { metric_name: m.name, value: Math.round(m.value), metric_rating: m.rating, metric_id: m.id })`.
   - `return null` — no DOM output.
   - No `onFID` — removed in web-vitals v5; `onINP` is the replacement.

2. **`src/app/[lang]/layout.tsx`** — derives `const consentGranted = consent === "granted"` from the SSR `readConsent()` cookie read (already present from 03-01). Mounts `<WebVitalsReporter consentGranted={consentGranted} />` after `<ConsentBar>`.

## Test Coverage

| File | Tests | Result |
|------|-------|--------|
| `src/components/WebVitalsReporter.test.tsx` | 6 (TDD RED→GREEN) | PASS |
| Full suite | 115 / 20 files | PASS |

Test cases:
- renders null (no DOM)
- no listeners registered when consentGranted=false
- no track() calls when consentGranted=false
- onLCP + onINP + onCLS registered when consentGranted=true
- track('web_vitals') called with correct shape on LCP metric (value rounded)
- track('web_vitals') called with correct shape on CLS metric

## Verification Results

- `bun run tsc --noEmit` exits 0 (no type errors)
- `bun run test src/components/WebVitalsReporter.test.tsx` — 6/6 pass
- `bun run test` (full suite) — 115/115 pass across 20 files
- `grep -c 'onFID(' src/components/WebVitalsReporter.tsx` → 0 (only comment mention)
- `grep -c 'track("web_vitals"' src/components/WebVitalsReporter.tsx` → 2 (call + type import context)
- `grep -c 'WebVitalsReporter' src/app/[lang]/layout.tsx` → 3 (import + mount + comment)
- `ANALYZE=true bun run build --webpack` exits 0, treemaps written to `.next/analyze/`
- Normal `bun run build` (Turbopack, no ANALYZE) exits 0, no treemap emitted

## Runtime Verification (post-deploy with GA id set)

These must be validated by the user after Dokploy deploy:
- GA4 Realtime → Events shows `web_vitals` with param `metric_name=LCP|INP|CLS` after Accept click
- No `web_vitals` events appear before Accept click
- Metric `rating` values on key pages: LCP < 2.5s → "good"; INP < 200ms → "good"; CLS < 0.1 → "good"

## Deviations from Plan

### [Rule 1 - Bug] Pre-existing consent.ts client-boundary build failure

**Found during:** Task 1 (`ANALYZE=true bun run build`)

**Issue:** `src/lib/consent.ts` imported `next/headers` (server-only API) and was also imported by `ConsentBar.tsx` (a `"use client"` component). Turbopack's stricter boundary tracking flagged this as a client-boundary violation: `importing module depends on "next/headers". API only available in Server Components`. The build had been broken since 03-02 added `readConsent` to multiple key pages while `writeConsent` remained in the same file. The error was hidden under the Turbopack build in 03-02 context but surfaced during `ANALYZE=true bun run build` (which uses webpack — stricter module analysis).

**Fix:** Split `consent.ts` into two modules:
- `src/lib/consent.ts` — client-safe: `SS_CONSENT_COOKIE` constant + `writeConsent()` only. No `next/headers` import.
- `src/lib/consent.server.ts` — server-only: `readConsent()` via `next/headers`; imports `SS_CONSENT_COOKIE` from `consent.ts`.

All 6 server pages (`layout.tsx`, `page.tsx`, `faq/page.tsx`, `laval/page.tsx`, `services/page.tsx`, `services/[slug]/page.tsx`) updated to `import { readConsent } from "@/lib/consent.server"`.

`ConsentBar.tsx` and `ConsentBar.test.tsx` unchanged — they import only `writeConsent`/`SS_CONSENT_COOKIE` from `consent.ts`.

**Files modified:** `src/lib/consent.ts`, `src/lib/consent.server.ts` (new), 6 server pages.

**Commit:** `9ce5151`

### [Rule 1 - Bug] vi.hoisted() required for Vitest mock init order

**Found during:** Task 2 TDD GREEN (tests ran but failed with `ReferenceError: Cannot access 'mockOnLCP' before initialization`)

**Issue:** Vitest hoists `vi.mock()` factory calls before module-level `const` declarations. `mockOnLCP = vi.fn()` was declared after `vi.mock("web-vitals", ...)` in source but referenced inside the factory — at runtime the factory ran first.

**Fix:** Replaced `const mockOnLCP = vi.fn()` style with `const { mockOnLCP, ... } = vi.hoisted(() => ({ mockOnLCP: vi.fn(), ... }))` — `vi.hoisted()` guarantees initialization order before mock factories run.

**Files modified:** `src/components/WebVitalsReporter.test.tsx`

## Known Stubs

None. WebVitalsReporter is fully wired: listeners fire → `track()` called → GA4 receives events (when `NEXT_PUBLIC_GA_ID` is set and consent granted).

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: network-egress | src/components/WebVitalsReporter.tsx | Metric payloads (name, rounded value, rating, opaque id) sent to GA4 on CWV callback. Mitigated: T-03-08 (no PII, values rounded), T-03-09 (consent-gated registration). Covered in plan threat model. |

## Self-Check: PASSED
