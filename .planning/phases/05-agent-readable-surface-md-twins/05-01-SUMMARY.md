---
phase: 05-agent-readable-surface-md-twins
plan: 01
subsystem: api
tags: [next.js, markdown, route-handlers, typescript, serializer]

requires:
  - phase: 04-content-expansion
    provides: services/comparisons/guides registries and path builders

provides:
  - "page-dates.ts: single shared date source (PAGE_DATES + pageDate()) for sitemap and .md twins"
  - "md-routes.ts: allMdPaths() — canonical route enumerator mirroring sitemap.ts registries"
  - "md-serializer.ts: 3 shared helpers + 14 renderXxxMd() per route family (pure, no server-only)"
  - "md-serializer.test.ts: 55 unit tests proving no-server-only constraint"
  - "en.md/route.ts, fr.md/route.ts, es.md/route.ts, ar.md/route.ts: home .md twins — all 4 serve HTTP 200 text/markdown"

affects:
  - "05-02 fan-out: Plan 02 must use app/[lang]/<name>.md/route.ts (static .md segment under dynamic [lang]) — NOT literal-locale folders"
  - "llms.txt: may link to .md twins once all 14 route families are served"
  - "proxy.ts: /...md paths auto-excluded by matcher dot-rule — no STANDALONE_PATHS entries needed"

tech-stack:
  added: []
  patterns:
    - "page-dates.ts pattern: extract date constants into a pure shared module (no server-only, no live clock)"
    - "md-serializer pattern: pure dictionary-to-markdown render functions (no server-only, Vitest-importable)"
    - "literal-locale static folder pattern: app/en.md/ app/fr.md/ etc. for per-locale static .md routes at root level"
    - "Block[] cast pattern for dict sections: use 'as Block[]' when dict type is wider than alias"

key-files:
  created:
    - src/lib/page-dates.ts
    - src/lib/md-routes.ts
    - src/lib/md-serializer.ts
    - src/lib/md-serializer.test.ts
    - src/app/en.md/route.ts
    - src/app/fr.md/route.ts
    - src/app/es.md/route.ts
    - src/app/ar.md/route.ts
  modified:
    - src/app/sitemap.ts

key-decisions:
  - "PROVEN — Literal static locale folders (Option A) for home .md twin: app/en.md/ app/fr.md/ app/es.md/ app/ar.md/ — same dot-in-folder idiom as app/llms.txt/, force-static prerender confirmed, all 4 return HTTP 200 text/markdown"
  - "DISPROVED — Assumption A1: [lang].md dynamic route does NOT produce /en.md with params {lang:'en'} in Next.js 16. The .md suffix is captured into the lang param ('en.md' not 'en'); force-static prerender crashes. The [lang].md folder was deleted (was never committed)."
  - "Plan 02 architecture: use app/[lang]/<name>.md/route.ts (static .md segment under dynamic [lang]) for the 13 non-home route families — NOT literal-locale folders (that pattern is only needed for root-level home twins)"
  - "Proxy auto-exclusion confirmed: /...md paths are excluded by the middleware matcher's .*\\..*  dot-rule — no STANDALONE_PATHS entry needed for any .md twin route"
  - "pageDate() returns YYYY-MM-DD strings (not Date objects) — md-serializer needs strings for frontmatter"
  - "D-04 thin pages (appointments, gallery): emit dict heading/intro + link-out to canonical"
  - "Reviews: emit aggregate rating from reviews.ts + CTA, link out for individual quotes (not in dict)"
  - "renderTermsMd/renderPrivacyMd cast blocks as Block[] because dict infers {kind:string}[] (wider than Block's 'p'|'h3'|'ul' literal union)"

patterns-established:
  - "Pure serializer pattern: md-serializer.ts imports no server-only modules — importable from Vitest"
  - "Shared date source pattern: PAGE_DATES in page-dates.ts feeds both sitemap.ts and .md frontmatter"
  - "Route enumerator pattern: allMdPaths() mirrors sitemap.ts registry order exactly"
  - "Literal-locale static folder: root-level .md twins (home only) use en.md/ fr.md/ es.md/ ar.md/"

requirements-completed: [EXP-03]

duration: ~75min
completed: 2026-06-24
status: complete
---

# Phase 05 Plan 01: .md Twin Foundation Summary

**page-dates.ts + md-routes.ts + md-serializer.ts (55 tests) + 4 literal locale home .md twin handlers — all delivered and smoke-tested**

## Performance

- **Duration:** ~75 min (Tasks 1+2: ~50 min; Task 3: ~25 min)
- **Completed:** 2026-06-24
- **Tasks:** 3 of 3 complete
- **Files modified:** 9 (8 created, 1 refactored)

## Accomplishments

- Extracted `PAGE_DATES`/`pageDate()` from `sitemap.ts` into `src/lib/page-dates.ts` — single date source for both sitemap and .md frontmatter (`updated` field)
- Created `src/lib/md-routes.ts` with `allMdPaths()` enumerating the same 6 registry groups as sitemap.ts in the same order — coverage parity gate anchor for Plan 02
- Created `src/lib/md-serializer.ts` (pure, no server-only) with 3 shared helpers (`frontmatter()`, `renderBlocks()`, `renderComparisonTable()`) and 14 `renderXxxMd()` functions — all 55 unit tests pass
- Created 4 literal static locale route handlers: `src/app/en.md/route.ts`, `fr.md/route.ts`, `es.md/route.ts`, `ar.md/route.ts` — all serve HTTP 200 + text/markdown with YAML frontmatter opening
- Deleted the broken `src/app/[lang].md/` folder (was untracked, never committed; assumption A1 disproved)

## Task Commits

1. **Task 1: Extract page-dates.ts and build md-routes.ts** — `5fc80f0`
2. **Task 2: Build md-serializer.ts (TDD)** — `1d82c7c` (feat) + `1ac9c3f` (fix: Block[] cast)
3. **Task 3: Home .md twins — 4 literal locale route handlers** — `2bbdd3c`

## Files Created/Modified

- `src/lib/page-dates.ts` — PAGE_DATES record + pageDate() returning YYYY-MM-DD strings
- `src/lib/md-routes.ts` — allMdPaths() enumerating locales × nav/secondaryNav/localPaths/services/comparisons/guides
- `src/lib/md-serializer.ts` — Pure serializer: frontmatter(), renderBlocks(), renderComparisonTable(), 14 renderXxxMd()
- `src/lib/md-serializer.test.ts` — 55 tests asserting all behaviors (no mocks; imports real en.json)
- `src/app/sitemap.ts` — Refactored to import pageDate() from @/lib/page-dates
- `src/app/en.md/route.ts` — Home .md twin for /en.md (force-static, text/markdown)
- `src/app/fr.md/route.ts` — Home .md twin for /fr.md (force-static, text/markdown)
- `src/app/es.md/route.ts` — Home .md twin for /es.md (force-static, text/markdown)
- `src/app/ar.md/route.ts` — Home .md twin for /ar.md (force-static, text/markdown)

## Smoke Test Results

All 4 home .md twins verified via `curl` against production server (`bun run build --webpack` + `next start`):

| URL | HTTP | Content-Type | Body opens with |
|-----|------|--------------|-----------------|
| /en.md | 200 | text/markdown; charset=utf-8 | `---\ntitle: "Sans Souci Ongles & Spa — Manicure & Pedicure in Laval"` |
| /fr.md | 200 | text/markdown; charset=utf-8 | `---\ntitle: "Sans Souci Ongles & Spa — Manucure & Pédicure à Laval"` |
| /es.md | 200 | text/markdown; charset=utf-8 | `---\ntitle: "Sans Souci Ongles & Spa — Manicura y Pedicura en Laval"` |
| /ar.md | 200 | text/markdown; charset=utf-8 | `---\ntitle: "Sans Souci Ongles & Spa — مانيكير وباديكير في لافال"` |

## Decisions Made

- `pageDate()` returns `YYYY-MM-DD` strings (not Date objects) — md-serializer needs strings for frontmatter
- D-04 thin pages (appointments, gallery): emit dict heading/intro + link-out to canonical
- Reviews: emit aggregate rating from `reviews.ts` + CTA, link out for individual quotes (not in dict)
- `renderTermsMd`/`renderPrivacyMd` cast blocks `as Block[]` because dict infers `{kind:string}[]` (wider than Block's `"p"|"h3"|"ul"` literal union)
- **Option A (literal-locale folders) chosen for home twin** — disproves assumption A1 cleanly, no redirect layer, force-static confirmed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Block[] type mismatch in renderTermsMd/renderPrivacyMd**
- **Found during:** Task 2 TypeScript check
- **Issue:** `dict.legal.terms/privacy.sections[].blocks` is inferred as `{kind:string;text:string;items:string[]}[]`, wider than `Block[]` (requires `kind:"p"|"h3"|"ul"` literal and `items:readonly string[]`)
- **Fix:** Used `section.blocks as Block[]` cast
- **Files modified:** `src/lib/md-serializer.ts`
- **Committed in:** `1ac9c3f`

---

**2. [Rule 3 - Blocking] Replaced broken [lang].md dynamic route with 4 literal static locale folders**
- **Found during:** Task 3 — architectural decision by user (Option A)
- **Issue:** Next.js 16 `[lang].md` does not produce `/en.md` with `params.lang = 'en'`. The `.md` suffix is captured INTO the param (`lang = 'en.md'`); `isLocale('en.md')` returns false → 404. `generateStaticParams` is ignored for this segment shape; force-static prerender crashes.
- **Fix:** Delete `src/app/[lang].md/route.ts` (was untracked, never committed). Create 4 literal static route handlers: `src/app/en.md/route.ts`, `fr.md/`, `es.md/`, `ar.md/` — same dot-in-folder idiom as `app/llms.txt/`.
- **Committed in:** `2bbdd3c`

---

**Total deviations:** 2 (1 auto-fixed type bug; 1 architecture pivot per user decision)
**Impact on plan:** All must-haves delivered. The deviation on Task 3 surface is the key finding that shapes Plan 02.

## CRITICAL FINDINGS FOR PLAN 02

### Finding 1: Assumption A1 DISPROVED — `[lang].md` is NOT a valid Next.js 16 dynamic route

The `app/[lang].md/` folder convention does NOT produce URLs like `/en.md` with params `{lang:'en'}`.
- `isDynamicRoute('/[lang].md')` returns `false` — Next.js does not treat `[lang]` as a dynamic segment when `.md` is appended within the same path segment
- `getRouteMatcher('/[lang].md')` produces regex capturing `lang = 'en.md'` (not `'en'`)
- force-static prerender crashes; `generateStaticParams` is silently ignored

### Finding 2: Plan 02 route architecture — `app/[lang]/<name>.md/route.ts`

Plan 02's 13 non-home route families are UNAFFECTED by this finding. They live under `[lang]/` as:
```
src/app/[lang]/about.md/route.ts     → /en/about.md, /fr/about.md, ...
src/app/[lang]/services.md/route.ts  → /en/services.md, /fr/services.md, ...
```
This is **static `.md` segment under a dynamic `[lang]`** — exactly the `app/llms.txt/` precedent where the folder name itself has a dot. Plan 02 MUST follow this pattern, NOT literal-locale folders.

### Finding 3: Proxy auto-exclusion confirmed

`/...md` paths are excluded by the middleware matcher's `.*\\..*` dot-rule. No `STANDALONE_PATHS` entry is needed in `src/proxy.ts` for any `.md` twin route (confirms the plan prohibition).

### Finding 4: Worktree build environment limitation

Turbopack build fails in this worktree due to sparse node_modules (only `next` symlinked). Build verified via webpack: `npx next build --webpack`. This is an environment limitation, not a code issue. The production CI build (full node_modules) will use Turbopack and should succeed.

## Known Stubs

None — every `.md` section derives from dictionary/site/registry data (D-03).

## Threat Surface Scan

No new threat surface introduced:
- All 4 home route handlers are force-static (no runtime user input)
- No new network endpoints (these are static file equivalents)
- No auth, no new data stores
- The `.md` body sources exclusively from committed dictionary data + site.ts constants

The `lang` input path security concern (T-05-01) is fully addressed: the literal-locale folder approach eliminates the path-param injection risk entirely — there is no param to validate. Each route handler is hardcoded for its locale.

## Next Phase Readiness

Plan 02 can proceed with the following architecture:
- Non-home routes: `src/app/[lang]/<name>.md/route.ts` (static `.md` under dynamic `[lang]`)
- Home is already done (this plan)
- Proxy: no STANDALONE_PATHS additions needed
- The serializer and route enumerator are fully ready

Ready:
- `page-dates.ts` ✓ complete
- `md-routes.ts` ✓ complete
- `md-serializer.ts` ✓ complete (55 tests pass)
- Home .md twins ✓ all 4 smoke-tested (HTTP 200, text/markdown)

---
*Phase: 05-agent-readable-surface-md-twins*
*Status: complete*
*Last updated: 2026-06-24*

## Self-Check: PASSED

- FOUND: `src/lib/page-dates.ts`
- FOUND: `src/lib/md-routes.ts`
- FOUND: `src/lib/md-serializer.ts`
- FOUND: `src/lib/md-serializer.test.ts`
- FOUND: `src/app/en.md/route.ts`
- FOUND: `src/app/fr.md/route.ts`
- FOUND: `src/app/es.md/route.ts`
- FOUND: `src/app/ar.md/route.ts`
- FOUND: commit `5fc80f0` (Task 1)
- FOUND: commit `1d82c7c` (Task 2)
- FOUND: commit `1ac9c3f` (fix: Block[] cast)
- FOUND: commit `2bbdd3c` (Task 3: 4 locale route handlers)
