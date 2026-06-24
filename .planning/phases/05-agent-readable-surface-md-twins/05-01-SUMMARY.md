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
  - "BLOCKED: [lang].md/route.ts — home .md twin NOT deliverable via [lang].md folder convention"

affects:
  - "05-01 follow-on: Plan 02 fan-out MUST NOT proceed until home URL architecture is resolved"
  - "llms.txt: may need update to link .md twins once route architecture is decided"
  - "proxy.ts: STANDALONE_PATHS will need entries for .md twin URLs"

tech-stack:
  added: []
  patterns:
    - "page-dates.ts pattern: extract date constants from route files into a pure shared module"
    - "md-serializer pattern: pure dictionary-to-markdown render functions (no server-only)"
    - "Block[] cast pattern for dict sections: use 'as Block[]' when dict type is wider than alias"

key-files:
  created:
    - src/lib/page-dates.ts
    - src/lib/md-routes.ts
    - src/lib/md-serializer.ts
    - src/lib/md-serializer.test.ts
  modified:
    - src/app/sitemap.ts

key-decisions:
  - "BLOCKED: Next.js 16 [lang].md folder convention does NOT produce /en.md with params {lang:'en'} — the .md suffix is captured INTO the lang param (isDynamicRoute('/[lang].md') = false; matcher captures 'en.md' not 'en'). force-static prerender crashes. Must choose alternative architecture before Plan 02."
  - "md-serializer.ts: dict.legal sections use 'as Block[]' cast because dict infers blocks as {kind:string}[] (wider than Block's literal union), resolved with cast"
  - "renderTermsMd/renderPrivacyMd: removed explicit section type annotation, added cast on blocks"

patterns-established:
  - "Pure serializer pattern: md-serializer.ts imports no server-only modules — importable from Vitest"
  - "Shared date source pattern: PAGE_DATES in page-dates.ts feeds both sitemap.ts and .md frontmatter"
  - "Route enumerator pattern: allMdPaths() mirrors sitemap.ts registry order exactly"

requirements-completed: [EXP-03]

duration: ~50min
completed: 2026-06-23
status: blocked
---

# Phase 05 Plan 01: .md Twin Foundation Summary

**page-dates.ts + md-routes.ts + md-serializer.ts (55 tests) delivered; [lang].md home route BLOCKED — Next.js 16 does not recognize [lang].md as a dynamic route with lang param, collapsing force-static prerender**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-06-23T13:42:00Z (resumed session)
- **Completed:** 2026-06-23T17:28:00Z
- **Tasks:** 2 of 3 complete; Task 3 blocked
- **Files modified:** 5 (4 created, 1 refactored)

## Accomplishments

- Extracted `PAGE_DATES`/`pageDate()` from `sitemap.ts` into `src/lib/page-dates.ts` — single date source for both sitemap and .md frontmatter (`updated` field)
- Created `src/lib/md-routes.ts` with `allMdPaths()` enumerating the same 6 registry groups as sitemap.ts in the same order — coverage parity gate anchor for Plan 02
- Created `src/lib/md-serializer.ts` (pure, no server-only) with 3 shared helpers (`frontmatter()`, `renderBlocks()`, `renderComparisonTable()`) and 14 `renderXxxMd()` functions — all 55 unit tests pass

## Task Commits

1. **Task 1: Extract page-dates.ts and build md-routes.ts** — `5fc80f0` (feat)
2. **Task 2: Build md-serializer.ts (TDD)** — `1d82c7c` (feat) + `1ac9c3f` (fix: readonly Block[] cast)
3. **Task 3: Home [lang].md route handler** — BLOCKED (see critical finding below)

## Files Created/Modified

- `src/lib/page-dates.ts` — PAGE_DATES record + pageDate() returning YYYY-MM-DD strings
- `src/lib/md-routes.ts` — allMdPaths() enumerating locales × nav/secondaryNav/localPaths/services/comparisons/guides
- `src/lib/md-serializer.ts` — Pure serializer: frontmatter(), renderBlocks(), renderComparisonTable(), 14 renderXxxMd()
- `src/lib/md-serializer.test.ts` — 55 tests asserting all behaviors (no mocks; imports real en.json)
- `src/app/sitemap.ts` — Refactored to import pageDate() from @/lib/page-dates

## Decisions Made

- `pageDate()` returns `YYYY-MM-DD` strings (not Date objects) — md-serializer needs strings for frontmatter
- D-04 thin pages (appointments, gallery): emit dict heading/intro + link-out to canonical
- Reviews: emit aggregate rating from `reviews.ts` + CTA, link out for individual quotes (not in dict)
- `renderTermsMd`/`renderPrivacyMd` cast blocks `as Block[]` because dict infers `{kind:string}[]` (wider than Block's `"p"|"h3"|"ul"` literal union)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Block[] type mismatch in renderTermsMd/renderPrivacyMd**
- **Found during:** Task 3 (TypeScript check during build verification)
- **Issue:** `dict.legal.terms/privacy.sections[].blocks` is inferred as `{kind:string;text:string;items:string[]}[]`, wider than `Block[]` (which requires `kind:"p"|"h3"|"ul"` literal and `items:readonly string[]`). Both explicit type annotations (`section: {heading:string; blocks:readonly Block[]}`) failed tsc.
- **Fix:** Removed explicit section parameter type annotation; used `section.blocks as Block[]` cast
- **Files modified:** `src/lib/md-serializer.ts`
- **Verification:** `npx tsc --noEmit` clean; 55 tests still pass
- **Committed in:** `1ac9c3f` (fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** Necessary type fix, no behavioral change.

## CRITICAL FINDING: Task 3 Convention Failure (Assumption A1 Disproved)

**The `app/[lang].md/` folder convention does NOT produce URLs like `/en.md` with params `{lang:'en'}`.**

### Evidence

1. **`isDynamicRoute('/[lang].md')` returns `false`** in Next.js 16's route utilities. Next.js does not recognize `[lang].md` as a dynamic segment because `[lang]` does not span the full path segment (`.md` is appended).

2. **URL matching captures the wrong value:** `getRouteMatcher('/[lang].md')` produces regex `/^\/([^/]+?)(?:\/)?$/` which, when matched against `/en.md`, captures `lang = 'en.md'` (NOT `'en'`). The `.md` suffix is captured INTO the param.

3. **Webpack build + prerender crash:** `bun run build -- --webpack` compiled successfully but crashed during static page generation:
   ```
   TypeError: Cannot read properties of undefined (reading 'lang')
   Export encountered an error on /[lang].md/route
   ```
   Because Next.js treats `[lang].md` as a static route, `generateStaticParams` is ignored, and params resolve to `{}`.

4. **Turbopack build fails entirely:** The worktree's sparse node_modules (only `next` symlinked) prevent Turbopack from resolving all dependencies. This is an environment issue separate from the convention failure.

### What DOES Work

- Runtime routing: a request to `/en.md` matches `[lang].md/route.ts` at the filesystem level, but `params.lang` is `'en.md'` not `'en'` — `isLocale('en.md')` returns false → 404.
- The route IS recognized by Next.js's type system (added to `routes.d.ts`), but with `ParamMap["/[lang].md"] = {}`.

### Required Architectural Decision

The user must choose ONE approach before Plan 02 can proceed:

**Option A: Static per-locale routes (4 files)**
- Create `src/app/en.md/route.ts`, `src/app/fr.md/route.ts`, `src/app/es.md/route.ts`, `src/app/ar.md/route.ts`
- Each imports the appropriate locale's dict and calls `renderHomeMd()`
- Pros: Exactly the right URLs (`/en.md`), no redirect needed, force-static works
- Cons: 4 files instead of 1; Plan 02 fan-out would need this pattern × 10 more route families

**Option B: RESEARCH fallback — `/[lang]/home.md` + redirect**
- `src/app/[lang]/home.md/route.ts` → serves `/en/home.md` (with `[lang]` as full segment — works)
- Add Next.js redirect from `/[lang].md` → `/[lang]/home.md`
- Pros: Single dynamic file, redirect keeps original URL
- Cons: Adds redirect layer; all non-home .md twins would need `/[lang]/services.md`, `/[lang]/about.md` etc. (URL pattern changes from `/en.md` to `/en/home.md`)

**Option C: Middleware rewrite**
- In `src/middleware.ts`, rewrite requests matching `/:lang.md` → `/:lang/home.md` (or a static handler)
- More complex but keeps URLs clean

**Option D: Rename strategy — keep `/[lang].md` but extract lang from URL string**
- Keep `[lang].md/route.ts` but instead of `await ctx.params`, extract lang from `new URL(request.url).pathname.split('/')[1].replace('.md','')`
- Must validate the extracted lang with isLocale()
- Works for runtime; `force-static` still broken (generateStaticParams ignored → no prerendering)
- Conclusion: Only viable if we drop force-static and serve dynamically

## Issues Encountered

- Turbopack build fails in worktree due to sparse node_modules (only `next` symlinked). This is an environment limitation, not a code bug. Webpack build worked via `bun run build -- --webpack`.
- Next.js 16 `routes.d.ts` generates `ParamMap["/[lang].md"] = {}` even when `generateStaticParams` returns locale objects — the type generator uses `isDynamicRoute()` which returns false for this pattern.

## User Setup Required

None — no external services required.

## Next Phase Readiness

**BLOCKED.** Plan 02 fan-out MUST NOT proceed until the home `.md` URL architecture is resolved.

The serializer and route enumerator are fully ready for whichever architecture is chosen — they are pure modules that the route handlers will import. The decision only affects WHICH folder structure is used for the route files.

Ready when decision is made:
- `page-dates.ts` ✓ complete
- `md-routes.ts` ✓ complete  
- `md-serializer.ts` ✓ complete (55 tests pass)
- Route architecture: DECISION REQUIRED

---
*Phase: 05-agent-readable-surface-md-twins*
*Status: BLOCKED — architectural decision required*
*Last updated: 2026-06-23*
