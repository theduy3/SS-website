---
phase: 02-content-schema-crawl-surface
plan: "03"
subsystem: crawl-surface
tags: [llms.txt, sitemap, proxy, standalone-paths, ai-crawler, x-default, schema]

# Dependency graph
requires:
  - phase: 02-content-schema-crawl-surface
    provides: "NAP/service constants in site.ts (imported by llms.txt route)"
provides:
  - /llms.txt force-static route returning curated EN business brief (NAP, services, hours, key-page links)
  - /llms.txt registered in STANDALONE_PATHS — locale-routing bypass locked by merge-gate test
  - sitemap.ts emits x-default alternate on every entry (points to defaultLocale=fr)
  - sitemap.ts uses static PAGE_DATES map — deterministic lastModified, no live new Date()
  - AggregateRating gate verified by test (omitted when reviewsFetchedAt is null, included when truthy)
affects: [phase-03-measurement-conversion, any future standalone route additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "STANDALONE_PATHS merge-gate: every non-[lang] route requires a proxy.test.ts assertion before merge"
    - "force-static route handler for plain-text AI crawler surfaces (no locale redirect)"
    - "PAGE_DATES map for deterministic sitemap lastModified (not live new Date())"

key-files:
  created:
    - src/app/llms.txt/route.ts
    - src/app/llms.txt/route.test.ts
    - src/app/sitemap.test.ts
  modified:
    - src/proxy.ts
    - src/proxy.test.ts
    - src/app/sitemap.ts
    - src/lib/seo.test.ts

key-decisions:
  - "llms.txt imports directly from site.ts (NAP, hours, services) — single source of truth, no duplication"
  - "x-default points to /fr/<slug> (defaultLocale=fr) consistent with existing hreflang strategy"
  - "PAGE_DATES map uses static dates per route slug — deterministic across builds (D-09)"
  - "hoursLine parameter typed as readonly string[] to match site.hours as const tuples"

patterns-established:
  - "STANDALONE_PATHS merge-gate: proxy.test.ts assertion required for every non-[lang] route (mirrors /clientportal pattern)"
  - "force-static + text/plain route for AI-readable plain-text surfaces"

requirements-completed: [CRAWL-01, CRAWL-02, SCHEMA-03]

# Metrics
duration: 15min
completed: 2026-06-17
---

# Phase 02 Plan 03: /llms.txt Crawl Surface + Sitemap Hygiene Summary

**Force-static /llms.txt AI crawler route with proxy merge-gate, x-default sitemap alternates with static PAGE_DATES, and AggregateRating gate test — all 4 CRAWL/SCHEMA-03 truths verified, 93/93 tests pass**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-18T05:19:00Z
- **Completed:** 2026-06-18T05:26:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- `/llms.txt` GET handler returns HTTP 200, `Content-Type: text/plain; charset=utf-8`, with curated EN business brief sourced from `site.ts` (NAP, hours, services, booking link, key-page links) — `export const dynamic = "force-static"` prevents locale redirect
- `/llms.txt` registered in `STANDALONE_PATHS` in `src/proxy.ts`; `src/proxy.test.ts` asserts the path bypasses locale routing (CRAWL-01 merge gate, mirrors `/clientportal` pattern)
- `sitemap.ts` emits `x-default` alternate on every entry (pointing to `defaultLocale=fr`), replaces live `new Date()` with `PAGE_DATES` static map for deterministic `lastModified` across builds (CRAWL-02)
- `seo.test.ts` asserts `organizationGraph` omits `aggregateRating` when `reviewsFetchedAt` is null and includes it when truthy (SCHEMA-03 gate verified both directions)

## Task Commits

Each task was committed atomically:

1. **Task 1: /llms.txt route + proxy STANDALONE registration + tests** — `2542c34` (feat)
2. **Task 2: sitemap x-default alternates + static lastModified + SCHEMA-03 gate test** — `cc1aec5` (feat)
3. **Task 3 (deviation fix): readonly type on hoursLine parameter** — `12a58d7` (fix)

## Files Created/Modified

- `src/app/llms.txt/route.ts` — Force-static GET handler; returns `text/plain` EN business brief from `site.ts` constants
- `src/app/llms.txt/route.test.ts` — Asserts 200, `text/plain` content-type, body contains business name, address, key-page links
- `src/proxy.ts` — Added `"/llms.txt"` to `STANDALONE_PATHS` array (line 18)
- `src/proxy.test.ts` — Added assertion that `/llms.txt` is NOT locale-redirected
- `src/app/sitemap.ts` — `x-default` added to every entry's `alternates.languages`; `new Date()` replaced by `PAGE_DATES` map + `FALLBACK_DATE`
- `src/app/sitemap.test.ts` — Asserts every entry has `x-default`, `lastModified` is a Date, `/laval` entries exist for all 4 locales, `x-default` for `/laval` points to `/fr/laval`
- `src/lib/seo.test.ts` — Asserts `organizationGraph` omits/includes `aggregateRating` based on `reviewsFetchedAt` flag

## Decisions Made

- **`llms.txt` imports from `site.ts` directly** — no data duplication; if NAP or hours change in one place, llms.txt stays correct automatically.
- **`x-default` points to `/fr/<slug>`** — consistent with existing hreflang strategy where `defaultLocale` is `fr`.
- **Static `PAGE_DATES` map** — deterministic `lastModified` values across builds (D-09 compliance). Live `new Date()` was misleading crawlers that every page changed on every deploy.
- **`readonly string[]` on `hoursLine`** — `site.hours` uses `as const` tuples, which are `readonly`; parameter type must match to be assignable (caught by tsc during build verification).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed readonly type mismatch on hoursLine parameter**
- **Found during:** Build verification after Task 1
- **Issue:** `site.hours` is typed as `readonly` tuples (`as const`); the `hoursLine` helper parameter accepted `string[]` (mutable), making it unassignable
- **Fix:** Changed parameter type from `string[]` to `readonly string[]` in `src/app/llms.txt/route.ts`
- **Files modified:** `src/app/llms.txt/route.ts`
- **Verification:** `tsc --noEmit` passes, build clean
- **Committed in:** `12a58d7` (separate fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — type bug)
**Impact on plan:** Fix was necessary for build correctness. No scope creep.

## Issues Encountered

None beyond the readonly type fix above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 2 is complete: all 3 plans shipped (02-01 answer-first + FAQ schema, 02-02 Laval local page, 02-03 llms.txt + sitemap hygiene)
- All 8 Phase 2 requirements fulfilled: SCHEMA-01, SCHEMA-02, SCHEMA-03, CONTENT-01, CONTENT-02, CONTENT-03, CRAWL-01, CRAWL-02
- 93/93 tests pass; build and lint clean
- Phase 3 (Measurement & Conversion) is unblocked: GA4 AI-referrer channel setup (MEAS-01) must be configured BEFORE deploying Phase 2 content to live traffic (no backfill)
- Reminder: `STANDALONE_PATHS` merge-gate pattern is now established — any future non-`[lang]` route must add a `proxy.test.ts` assertion

---
*Phase: 02-content-schema-crawl-surface*
*Completed: 2026-06-17*
