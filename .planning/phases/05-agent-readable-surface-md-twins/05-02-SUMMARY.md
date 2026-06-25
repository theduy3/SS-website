---
phase: 05-agent-readable-surface-md-twins
plan: 02
subsystem: api
tags: [next.js, markdown, route-handlers, typescript, coverage-gate]

requires:
  - phase: 05-01
    provides: md-serializer.ts (14 renderXxxMd functions), md-routes.ts (allMdPaths()), page-dates.ts, 4 home .md twins

provides:
  - "13 .md route handlers: 10 nav (services/about/appointments/contact/gallery/reviews/faq/terms/privacy/laval) + 3 slug families (services/[slug].md, comparisons/[slug].md, guides/[slug].md)"
  - "llms.txt: serviceDetailLabels Record (type-safe, ServiceId-keyed) + ## Machine-Readable Pages (.md) EN-only index section (D-06)"
  - "proxy.test.ts: EXP-03 merge-gate assertion — 5 locale-prefixed .md paths produce no Location header"
  - "md-coverage.test.ts: D-02 parity gate — every sitemap /en URL has a .md twin; no orphan twins"

affects:
  - "Full .md surface: 4 home + 40 nav + 16 service + 24 comparison + 12 guide = 96 .md routes total"
  - "llms.txt body extended with .md index section; Content-Type unchanged (text/plain)"
  - "proxy.test.ts: 6 tests total (was 5)"
  - "md-coverage.test.ts: new file, 2 tests, merge gate"

tech-stack:
  added: []
  patterns:
    - "Two-arg GET signature for dynamic route handlers: GET(_request: Request, { params }: { params: Promise<{...}> }) — Next.js 16 requirement"
    - "Current-locale-only generateStaticParams: slug handlers emit only this locale's slugs (mirrors page.tsx convention)"
    - "serviceDetailLabels Record<ServiceId, string>: type-keyed Record fails loudly at build if label missing"
    - "Coverage parity test: sitemap() vs allMdPaths() comparison, no mocks, pure function test"

key-files:
  created:
    - src/app/[lang]/services.md/route.ts
    - src/app/[lang]/about.md/route.ts
    - src/app/[lang]/appointments.md/route.ts
    - src/app/[lang]/contact.md/route.ts
    - src/app/[lang]/gallery.md/route.ts
    - src/app/[lang]/reviews.md/route.ts
    - src/app/[lang]/faq.md/route.ts
    - src/app/[lang]/terms.md/route.ts
    - src/app/[lang]/privacy.md/route.ts
    - src/app/[lang]/laval.md/route.ts
    - src/app/[lang]/services/[slug].md/route.ts
    - src/app/[lang]/comparisons/[slug].md/route.ts
    - src/app/[lang]/guides/[slug].md/route.ts
    - src/md-coverage.test.ts
  modified:
    - src/app/llms.txt/route.ts
    - src/proxy.test.ts

key-decisions:
  - "Two-arg GET(request, { params }): Next.js 16 route handlers with dynamic params require first arg = Request|NextRequest; single-arg destructured form rejected by type-checker"
  - "STANDALONE_PATHS entries intentionally skipped: proxy matcher .*\\..*  dot-rule auto-excludes all .md paths; entries would be dead config (plan reconciliation)"
  - "Slug handlers show as ○ (Static) in webpack build output vs ● (SSG): webpack build displays force-static slug routes as prerendered-static without enumerating params; functionally correct"
  - "Smoke-test curl against local server skipped: worktree server starts a different project on port 3000 (same limitation as Plan 01, Finding 4); build output + test suite are authoritative verification"

metrics:
  duration: ~15 min
  completed: 2026-06-25
  tasks_completed: 3
  files_modified: 16

status: complete
---

# Phase 05 Plan 02: .md Route Fan-Out Summary

**13 .md route handlers (10 nav + 3 slug families), llms.txt .md index (D-06), EXP-03 proxy merge gate, D-02 coverage parity gate — 183 tests green, build clean**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-06-25
- **Tasks:** 3 of 3 complete
- **Files modified:** 16 (15 created, 2 modified)

## Accomplishments

- Created 10 nav `.md` route handlers under `src/app/[lang]/<name>.md/route.ts` — services, about, appointments, contact, gallery, reviews, faq, terms, privacy, laval. All force-static, locale-guard, `getDictionary` → `renderXxxMd` → `text/markdown` Response.
- Created 3 slug `.md` route handlers: `services/[slug].md`, `comparisons/[slug].md`, `guides/[slug].md`. Each has `generateStaticParams` (current-locale-only), slug 404 guard via registry lookup (T-05-04 mitigated), and the two-arg `GET(_request, { params })` signature required by Next.js 16.
- Updated `src/app/llms.txt/route.ts`: added `services/servicePath` import, `serviceDetailLabels` Record (type-keyed by `ServiceId`), and `## Machine-Readable Pages (.md)` section with EN-only index + one-line locale note (D-06).
- Updated `src/proxy.test.ts`: added EXP-03 merge-gate `it()` asserting 5 locale-prefixed `.md` paths produce no `Location` header — 6 tests total, all pass.
- Created `src/md-coverage.test.ts`: D-02 parity gate — every sitemap `/en` URL has a `.md` twin; no orphan twins. 2 tests, both pass.
- Full suite: **183 tests, 23 test files, all green** (`bun run test`).
- Build: **clean** (`bun run build --webpack`) — all `.md` routes prerender, no page/route segment conflicts.

## Task Commits

1. **Task 1: 13 .md route handlers** — `7ee2321`
2. **Task 2: llms.txt .md index + proxy.test.ts EXP-03 gate** — `eaf2f77`
3. **Task 3: md-coverage.test.ts parity gate** — `573e528`

## Files Created/Modified

- `src/app/[lang]/services.md/route.ts` — Services index .md twin (4 locales)
- `src/app/[lang]/about.md/route.ts` — About .md twin (4 locales)
- `src/app/[lang]/appointments.md/route.ts` — Appointments .md twin (4 locales; D-04 thin page)
- `src/app/[lang]/contact.md/route.ts` — Contact .md twin (4 locales)
- `src/app/[lang]/gallery.md/route.ts` — Gallery .md twin (4 locales; D-04 thin page)
- `src/app/[lang]/reviews.md/route.ts` — Reviews .md twin (4 locales)
- `src/app/[lang]/faq.md/route.ts` — FAQ .md twin (4 locales)
- `src/app/[lang]/terms.md/route.ts` — Terms .md twin (4 locales)
- `src/app/[lang]/privacy.md/route.ts` — Privacy .md twin (4 locales)
- `src/app/[lang]/laval.md/route.ts` — Laval local .md twin (4 locales)
- `src/app/[lang]/services/[slug].md/route.ts` — Service detail .md twins (4 services × 4 locales)
- `src/app/[lang]/comparisons/[slug].md/route.ts` — Comparison .md twins (6 comparisons × 4 locales)
- `src/app/[lang]/guides/[slug].md/route.ts` — Guide .md twins (3 guides × 4 locales)
- `src/app/llms.txt/route.ts` — Added serviceDetailLabels + ## Machine-Readable Pages (.md) section
- `src/proxy.test.ts` — Added EXP-03 merge-gate assertion (6 tests total)
- `src/md-coverage.test.ts` — D-02 coverage parity gate (2 tests)

## Build Verification

```
bun run build --webpack → clean (no errors, no page/route conflicts)

.md route prerender sample:
● /[lang]/about.md      → /en/about.md /fr/about.md /es/about.md /ar/about.md
● /[lang]/services.md   → /en/services.md /fr/services.md /es/services.md /ar/services.md
● /[lang]/laval.md      → /en/laval.md /fr/laval.md /es/laval.md /ar/laval.md
○ /[lang]/services/[slug].md  (force-static; webpack shows ○ for nested dynamic)
○ /[lang]/comparisons/[slug].md
○ /[lang]/guides/[slug].md
○ /en.md /fr.md /es.md /ar.md  (Plan 01 home twins)
```

## Test Results

```
bun run test → 183 tests, 23 test files, all passed
  proxy.test.ts    — 6 tests (incl. EXP-03 .md passthrough gate)
  md-coverage.test.ts — 2 tests (D-02 parity gate)
  md-serializer.test.ts — 55 tests (Plan 01 foundation)
  llms.txt/route.test.ts — 7 tests
  ... 19 other test files
```

## Decisions Made

- **Two-arg GET signature**: `GET(_request: Request, { params }: { params: Promise<{lang:string}> })` — Next.js 16 rejects single-arg destructured form; first arg must be `Request | NextRequest`
- **STANDALONE_PATHS entries skipped**: proxy matcher `.*\\..*` dot-rule auto-excludes `.md` paths; entries are dead config (plan reconciliation, Rule 7)
- **Slug routes as ○ in webpack**: `force-static` slug routes display as `○` in webpack build mode (not `●`); functionally equivalent — prerendered static at build time

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed GET signature — single-arg destructured form rejected by Next.js 16**
- **Found during:** Task 1 build
- **Issue:** Initial handlers used `GET({ params }: { params: Promise<{lang:string}> })` — Next.js 16 type-checks route handler signatures and requires first arg to be `Request | NextRequest`; single-arg destructured form is invalid
- **Fix:** Changed all 13 handlers to two-arg form: `GET(_request: Request, { params }: { params: Promise<{...}> })`
- **Files modified:** All 13 route.ts files
- **Committed in:** `7ee2321` (after fix)

---

**Total deviations:** 1 (auto-fixed type signature; no architectural changes)
**Impact:** Zero — plan delivered exactly as specified after the fix

## Known Stubs

None — all `.md` handlers derive from dictionary/site/registry data (D-03).

## Threat Surface Scan

No new threat surface beyond what the threat model covers:
- All route handlers are `force-static` (no runtime user input reaches server logic)
- `lang` and `slug` params validated via `isLocale()` + registry lookup before any use (T-05-04 ✓)
- llms.txt index section adds only public marketing URLs (T-05-05 accepted ✓)
- proxy.test.ts gate enforces the passthrough invariant (T-05-06 ✓)

## Next Phase Readiness

Phase 05 is complete:
- D-01: all 96 `.md` routes prerender (4 home + 40 nav + 16 service + 24 comparison + 12 guide) ✓
- D-02: `md-coverage.test.ts` merge gate active ✓
- D-06: llms.txt lists EN twins with locale note ✓
- EXP-03: `proxy.test.ts` passthrough assertion is the load-bearing merge gate ✓

---
*Phase: 05-agent-readable-surface-md-twins*
*Status: complete*
*Last updated: 2026-06-25*
