
## Routing — standalone (un-localized) pages need proxy.ts allowlist
New top-level pages siblings to [lang] (e.g. /clientportal, /checkin, /queue) are
locale-prefixed by `src/proxy.ts` (Next 16's renamed middleware) and 404 unless
added to `STANDALONE_PATHS`. Cloning the page files is not enough. Always grep
proxy.ts for the sibling exclusion when adding a standalone route.
SUPERSEDED by commit 508935d: STANDALONE_PATHS now lives in
`src/lib/standalone-routes.ts` and `standalone-routes.test.ts` fails CI if a
route with a standalone `<html>` layout is missing from the Set — no more manual
grep required, the guard is automatic.

## Shell — zsh does not word-split unquoted `for x in $var`
Bulk-generating N similar files with `for pair in $spaceSeparatedString; do`
silently iterated ONCE in zsh (no word-splitting like bash), writing only 1 of
10 files — with the wrong content, since the loop var held the whole string.
tsc/tests/build all stayed green; only a live curl caught the wrong page body.
Always use a real array: `pairs=(a:x b:y); for p in "${pairs[@]}"; do`.
(commit e7d92c9 — caught via curl, not CI)

## Vitest — `server-only` and `IntersectionObserver` need test-env stubs
Two jsdom/Vitest gaps that don't show up until a NEW module/component is tested:
- Importing any module with `import "server-only"` fails to resolve under
  Vitest (Next-only marker). Fix: alias `"server-only"` to a no-op stub in
  `vitest.config.ts` resolve.alias (commit e7d92c9).
- Rendering any component wrapped in `<Reveal>` (framer-motion `whileInView`)
  throws `IntersectionObserver is not defined` in jsdom. Fix: no-op
  IntersectionObserver stub in `vitest.setup.ts` (commit cfda176).
Both are one-time setup fixes — once added, all future server-only modules /
Reveal-wrapped components test cleanly with no per-test workaround.

## Refactor verification — CI green is not proof; diff the served output
tsc + vitest + build passing does NOT prove a route/render refactor preserved
behavior — it proves the code type-checks and runs. The actual proof used this
session, for every merged refactor:
- Route-enumeration changes (sitemap, .md routes): serve the prod build, curl
  the artifact, byte-diff against a baseline captured BEFORE the change
  (commit 0381c06 — sitemap.xml: 66833→66833 bytes, zero diff).
- Page-render changes (shared components): curl before/after HTML, normalize
  per-build noise (turbopack chunk hashes, CSS-module hashes) with sed before
  diffing — a raw diff is 100% noise on Next's hashed output (commit cfda176).
Capture the "before" artifact on a clean checkout BEFORE branching, not after.

## Architecture review — verify the proposed abstraction against real overlap
An architecture-review candidate proposed a shared content-tree AST because the
HTML page and its .md twin "render the same content." Reading the actual diff
showed the .md twin is a LOSSY SUBSET (7 of 9 sections, no chrome) — a shared
tree would carry the superset + per-adapter skip rules, failing the deletion
test. Narrowed to the one real duplication (a related-links selector) and
recorded the rejection as an ADR (commit 33b1754, docs/adr/0001) so the bigger
version doesn't get re-proposed next review. Always ground a "these two things
render the same data" claim in a real diff before designing the merge.

## Architecture review — an Explore-agent report is a hypothesis, not a finding
Two more candidates from the same review round (popup-draft conversion,
popups-store client seam) were both reported as structural leaks/missing
seams, and both dissolved on inspection before any code changed:
- Candidate said `admin/page.tsx` had conversion logic leaking inline. Reading
  the actual line showed `toPopup(draft)` was already one delegated call — no
  inline logic existed to extract (commit f89e9d3, docs/adr/0003).
- Candidate said `popups-store.ts` lacked an injectable Supabase-client seam
  to make it testable. Reading `dark-referral.test.ts` first showed this
  codebase's actual working precedent: test the `not_configured`/`null`
  degrade branch (env vars absent in test env), no mock, no injected client.
  Adding a seam would've been a brand-new pattern to solve an already-solved
  problem (commit 52d3a34, docs/adr/0004).
In both cases the real, narrower gap was zero test coverage on an
already-adequate seam — not the structural fix the report proposed. Before
implementing any review candidate: (1) read the exact call site the report
cites, don't trust its paraphrase; (2) grep for an existing precedent
elsewhere in the codebase before inventing a new pattern (Rule 11). A
candidate surviving this costs ~2 file reads; skipping it costs a wrong ADR.

## UI merge candidates — check every existing caller's layout context
Merging `BookingWidget` into the shared `WidgetEmbed` (real duplicate, real
precedent for extending its props) still needed a design pass mid-implementation:
`WidgetEmbed`'s light-theme sizing forces `min-h-screen` permanently, correct
for its 3 existing callers (bare standalone kiosk routes, own layout, no
header/footer) but wrong for `/appointments` (normal page, widget embedded
mid-content) — would have pushed the footer far below empty space. Caught by
checking each existing caller's route layout (`src/app/checkin/layout.tsx`
etc.) before assuming the shared component's defaults transfer, then verified
the fix visually in a real browser both locally and live post-deploy (commit
fdd0cd3). A component being "the same widget-injection pattern" doesn't mean
its layout defaults fit a new call site with a different page shape.
