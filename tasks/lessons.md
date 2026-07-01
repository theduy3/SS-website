
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

## After adding props to a shared component — check for its existing test file
Added `lang`/`minHeight` props to `WidgetEmbed` (commit fdd0cd3) without
checking whether it already had a test file — it did (`WidgetEmbed.test.tsx`,
RTL `render()` coverage for `storeAttr`/`theme`). The new props shipped
untested until a later, unrelated task re-surfaced the file. Fixed in
commit 421be98. Before editing any component's props, `ls` for a sibling
`.test.tsx` first — a component with existing test coverage has an implicit
contract that new props are expected to extend, not skip.

## Extracting hooks for a single call site — still needs error-ownership design
Extracted `usePopupList`/`usePopupForm` from `admin/page.tsx` (commit 12ba0df)
even though only one call site exists (weak reuse case) — the real
justification was locality (a 217-line component mixing list/draft/API-
lifecycle state, implicated in a real 502 incident), not leverage. Splitting
one component's state into two hooks isn't just a mechanical move-the-code
step: `remove()` had to be reassigned from "next to save()" to the list hook
(it mutates list contents, not the draft), and the single shared `error`
state had to become two owned-per-hook errors merged at the render site
(`listError ?? formError`) rather than a shared setter passed into both hooks
(which would've recreated the exact coupling being removed). Resolve state
ownership per hook explicitly before writing the extraction, not after.

## Grilling an "enforce X" candidate — compute current state; the hypothetical is often already live
The page-dates candidate (commit 38acd66) was filed as "a slug rename *would*
silently get FALLBACK_DATE." Grilling it started by computing the actual join:
route-universe groups all services under dateKey `/services`, but md-serializer
keyed each service twin `/services/${slug.en}` — a key absent from the table.
So the silent fallback was **already firing in production**: 4 service `.md`
twins shipped `updated: 2026-06-01` while the sitemap said `2026-06-17`. That
changed everything downstream — the fix is scoped-corrective (not purely
defensive), and the verification must *expect* an output delta (those 4 twins),
not assert byte-identical. Before implementing an enforcement candidate, run the
join by hand against real data; the "would happen" risk is frequently a live bug
that reshapes the fix and its acceptance test.

## Output-preserving refactor — the real gate is stash+rebuild+curl-diff, not tsc+tests
Candidates 1 and 3 (commits 66212cc, 300796b) claimed "no output change" (page
`<head>` metadata/JSON-LD, hreflang links, sitemap.xml). tsc + a green suite
prove neither — they can't see rendered HTML. The decisive gate: `git stash -u`
→ `next build` at HEAD → curl target pages → diff against the after-build curl.
Byte-identical = proof. Two builds + a stash dance, ~4 min, but it's the only
thing that actually catches a metadata regression on pages that have no unit
tests. Corollary: classify the candidate first — an output-*preserving* refactor
wants an empty diff; an output-*corrective* one (page-dates) wants a diff that is
non-empty and exactly the intended scope. Same tool, opposite pass condition.

## A review/exploration friction list is leads, not work — verify each premise before acting
The architecture-review Explore agent returned 11 friction points; only 4
survived. Several were killed by reading the actual code: the "routing has a
shadow regex duplicated across route-universe and md-routes" claim was false —
md-routes.ts *imports* `isSlugFamilyPath` from route-universe.ts, no copy. Others
were ADR-settled (registry re-exports are documented-intentional) or already
shared (`frontmatter()` exists). Filter every agent-surfaced finding against
three things before grilling it: the real imports/call sites (not the paraphrase),
the ADRs, and the deletion test. Cost is ~1-2 reads per finding; skipping it
means grilling a non-problem or re-suggesting an ADR-rejected change.

## Generalizing a helper — audit every literal for caller-specificity, classify each behavior delta
Extracting `parseBody` from the admin handlers (commit 95b65d6) meant the
generic helper couldn't keep the popup-specific `?? "Invalid popup"` fallback.
Before accepting the change to a generic `"Invalid request body"`, I traced
whether that branch was reachable: zod always populates `issues` on a failure,
so the `??` fallback fires only on an empty-issues error zod never produces —
the string change is dead. When lifting caller code into a shared helper, list
every literal/status/fallback it carries and label each delta reachable or dead;
ship only after each reachable one is proven equivalent. A "byte-identical
refactor" with an unaudited fallback string is an unverified claim.

## Bash tool loops — use absolute paths for curl/wc; PATH is not guaranteed per-invocation
`curl` and `wc` intermittently reported `command not found` inside `for` loops in
the Bash tool (each call is a fresh profile-initialized shell; PATH resolution
varied), while the same binary worked in a function body one call earlier. Cost
several wasted round-trips this round. For any scripted verification loop, use
`/usr/bin/curl`, `/usr/bin/wc` (resolve once via `command -v`) rather than bare
names.
