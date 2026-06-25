---
phase: 05-agent-readable-surface-md-twins
verified: 2026-06-25T17:03:00Z
status: passed
score: 3/3 success criteria verified; 14/14 route families verified
behavior_unverified: 0
overrides_applied: 0
requirement: EXP-03
warnings:
  - title: "renderServiceMd related-links use stale .md suffix (dead 404 links after Option C)"
    severity: warning
    file: src/lib/md-serializer.ts
    lines: "192, 197"
    detail: >
      The in-body "Related Comparisons" / "Related Guides" cross-links inside
      renderServiceMd() are built as `${comparisonPath(c,lang)}.md` and
      `${guidePath(g,lang)}.md` (e.g. /en/comparisons/gel-vs-regular-manicure.md).
      After the Option C fix, slug-family twins live at `/index.md`
      (/en/comparisons/gel-vs-regular-manicure/index.md), so these specific
      in-body links point at the OLD broken URL form that returns 404. The
      llms.txt index (D-06) and the md-coverage gate (D-02) both use the correct
      /index.md form via mdTwinUrl(), so this is isolated to the two related-link
      lines in renderServiceMd and is NOT covered by any test. Does not block any
      ROADMAP success criterion (twin content still derives correctly from the
      dictionary; the twin route itself serves 200) — it is a navigation-link
      correctness defect in twin BODY content. Recommend fixing to `/index.md`.
human_verification:
  - test: "Confirm whether dead /...comparisons/<slug>.md and /...guides/<slug>.md cross-links inside service-detail .md twins matter for crawler UX, or schedule the 2-line fix."
    expected: "Either accept (low impact: AI crawler can still reach the canonical via llms.txt /index.md index) or fix renderServiceMd lines 192/197 to emit /index.md."
    why_human: "Severity/priority is a product call; the orchestrator already verified twin routes serve 200 end-to-end."
---

# Phase 05: Agent-Readable Surface (.md twins) Verification Report

**Phase Goal:** Every `[lang]` content route (incl. Phase 04 comparisons/guides) serves a force-static `.md` twin returning HTTP 200 clean text, passed un-prefixed through the proxy, linked from `/llms.txt`, with content derived from the same dictionary source as the HTML (no drift). Requirement: **EXP-03**.
**Verified:** 2026-06-25T17:03:00Z
**Status:** passed (1 non-blocking warning + 1 human decision item)
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria (ROADMAP contract)

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| 1 | Every `[lang]` content route (incl. Phase 04 comparisons/guides) serves a force-static `.md` twin returning HTTP 200 clean text | ✓ VERIFIED | 17 route.ts handlers on disk: 4 home (`src/app/{en,fr,es,ar}.md/route.ts`), 10 nav (`src/app/[lang]/{services,about,appointments,contact,gallery,reviews,faq,terms,privacy,laval}.md/route.ts`), 3 slug families (`src/app/[lang]/{services,comparisons,guides}/[slug]/index.md/route.ts`). All declare `dynamic = "force-static"`, return `Content-Type: text/markdown`, 200 status; slug handlers 404 on unknown slug. Orchestrator confirmed 200 + correct frontmatter end-to-end on standalone server; `bun run build` clean. |
| 2 | `.md` routes pass through proxy un-prefixed; `proxy.test.ts` passthrough assertion is the load-bearing EXP-03 merge gate (matcher dot-rule auto-excludes dotted paths; STANDALONE_PATHS entries intentionally skipped as dead config) | ✓ VERIFIED | `src/proxy.ts` matcher `"/((?!_next|api|.*\\..*).*)"` excludes any dotted path → all `.md`/`index.md` paths bypass locale logic. `src/proxy.test.ts:39-62` asserts 5 locale-prefixed `.md`/`index.md` paths produce NO `Location` header. Test passes (proxy suite 6 tests green). No STANDALONE_PATHS entries for `.md` — consistent with criterion (Rule 7 reconciliation documented in SUMMARY). |
| 3 | All `.md` routes linked from `/llms.txt` (EN-only index); `.md` content derives from the SAME dictionary source as the HTML page (no drift) | ✓ VERIFIED | `src/app/llms.txt/route.ts:105-129` `## Machine-Readable Pages (.md)` section: home `/en.md`, 7 nav `.md`, services/comparisons/guides as `/index.md` (correct Option C form). `src/lib/md-serializer.ts` — all 14 `renderXxxMd()` derive 100% from `dict.*`, `site.*`, `aggregate`, and registries (services/comparisons/guides); zero hand-typed duplicate copy. |

**Score:** 3/3 success criteria verified.

### Observable Truths (derived from EXP-03 + verification focus)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 14 route families have a handler (home + 10 nav + 3 slug); Phase-04 comparisons & guides included | ✓ VERIFIED | Disk inventory: 4 home + 10 nav + 3 slug = 14 families. Old broken `[slug].md` handlers confirmed DELETED. |
| 2 | No-drift: every `renderXxxMd()` derives content from dictionary/site/registry, not hand-typed copy | ✓ VERIFIED | All 14 renderers read `dict.*`/`site.*`/`aggregate`/registries (md-serializer.ts). Pure module, no `server-only`, Vitest-importable. |
| 3 | Coverage parity (D-02): `md-coverage.test.ts` asserts every sitemap content route has a twin via `mdTwinUrl()`; no orphan twins | ✓ VERIFIED | `src/md-coverage.test.ts` — test 1 (every sitemap `/en` URL → twin via `mdTwinUrl`), test 2 (no orphan twins). Sitemap includes comparisons+guides registries → EXP-01/EXP-02 covered. Both tests pass. A new route can't ship without a twin. |
| 4 | Proxy passthrough (EXP-03 merge gate): `proxy.test.ts` asserts `.md`/`index.md` get NO Location header | ✓ VERIFIED | `src/proxy.test.ts:39-62`, 5 paths incl. `/en/about.md`, `/en/services/manicure/index.md`, `/en/comparisons/.../index.md`, `/en/guides/.../index.md`, `/en/services.md`. Passes. |
| 5 | `mdTwinUrl()` centralizes twin-URL construction (nav→`.md`, slug→`/index.md`); D-02 gate and llms.txt both use it | ✓ VERIFIED | `src/lib/md-routes.ts:37-45` `mdTwinUrl()`. md-coverage.test imports it; llms.txt emits matching `/index.md` for slug families (lines 119/124/129). |
| 6 | Test runner is Vitest (`bun run test`), never `bun test` | ✓ VERIFIED | `bun run test` → vitest run, 183 tests / 23 files green. md-coverage.test.ts comment explicitly warns "NEVER bun test". |

**Score:** 6/6 truths verified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/md-serializer.ts` | 14 pure renderXxxMd + 3 helpers, no drift | ✓ VERIFIED | 599 lines, 14 renderers + frontmatter/renderBlocks/renderComparisonTable. All dictionary/registry-derived. |
| `src/lib/md-routes.ts` | `mdTwinUrl()` + `allMdPaths()` mirroring sitemap | ✓ VERIFIED | Both present; mdTwinUrl branches nav vs slug correctly. |
| `src/md-coverage.test.ts` | D-02 parity merge gate | ✓ VERIFIED | 2 tests, uses mdTwinUrl(), both pass. |
| `src/proxy.test.ts` | EXP-03 passthrough assertion | ✓ VERIFIED | 6 tests; EXP-03 gate asserts no Location header on 5 dotted paths. |
| `src/app/llms.txt/route.ts` | EN-only `.md` index (D-06), correct /index.md form | ✓ VERIFIED | Machine-Readable Pages section lists all families with correct URL forms. |
| `src/app/{en,fr,es,ar}.md/route.ts` | 4 home twins (literal-folder Option) | ✓ VERIFIED | All force-static, text/markdown, renderHomeMd. |
| `src/app/[lang]/<name>.md/route.ts` ×10 | nav twins | ✓ VERIFIED | All force-static + isLocale guard + text/markdown + correct renderer. |
| `src/app/[lang]/<family>/[slug]/index.md/route.ts` ×3 | slug twins (Option C) | ✓ VERIFIED | services/comparisons/guides; force-static, generateStaticParams (current-locale), 404 on bad slug. |

### Key Link Verification

| From | To | Via | Status |
|------|----|----|--------|
| handlers | md-serializer renderXxxMd | direct import + call | ✓ WIRED |
| md-coverage.test | md-routes.mdTwinUrl + sitemap | import + parity assertion | ✓ WIRED |
| llms.txt | servicePath/comparisonPath/guidePath + `/index.md` | registry import + string build | ✓ WIRED |
| proxy matcher | `.md` dotted-path exclusion | regex `.*\\..*` | ✓ WIRED (asserted by proxy.test) |

### No-Drift Data-Flow Trace (criterion 3 / Level 4)

| Renderer | Data Source | Real Data | Status |
|----------|-------------|-----------|--------|
| renderHomeMd | `dict.hero/home/services/reviews` + `aggregate` + `site` | yes | ✓ FLOWING |
| renderServicesIndexMd / renderServiceMd | `dict.servicesPage/serviceDetails/serviceLabels` + registries | yes | ✓ FLOWING |
| renderComparisonMd | `dict.comparisons[id]` + Comparison registry | yes | ✓ FLOWING |
| renderGuideMd | `dict.guides[id]` + Guide registry | yes | ✓ FLOWING |
| nav renderers (about/contact/faq/laval/terms/privacy/reviews/gallery/appointments) | corresponding `dict.*` slices + `site` | yes | ✓ FLOWING |

No hand-typed duplicate prose found in any renderer. Frontmatter dates come from shared `pageDate()` (page-dates.ts), the same source feeding sitemap — no date drift.

### Behavioral Spot-Checks / Probe Execution

| Check | Command | Result | Status |
|-------|---------|--------|--------|
| Full suite | `bun run test` | 183 passed / 23 files | ✓ PASS |
| EXP-03 + D-02 gates | `bun run test md-coverage proxy` | 8 passed / 2 files | ✓ PASS |
| End-to-end 200 (twins) | orchestrator on `node .next/standalone/server.js` | /en.md, /en/about.md, /ar/faq.md, /en/services/manicure/index.md, /fr/services/manucure/index.md, /en/comparisons/.../index.md, /en/guides/.../index.md → 200 text/markdown; invalid slug → 404 | ✓ PASS (delegated, not re-run per instructions) |
| Build | `bun run build` | clean | ✓ PASS (delegated) |

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|-------------|--------|-------------|--------|----------|
| EXP-03 | REQUIREMENTS.md:21 | Every `[lang]` content route serves clean-text `.md` twin, force-static, linked from llms.txt, proxy passthrough assertion, no drift, covers EXP-01/EXP-02 pages | ✓ SATISFIED | All sub-clauses met. Note: REQUIREMENTS.md text still says "registered in STANDALONE_PATHS" — superseded by the dot-rule auto-exclusion deviation (documented, correct; the load-bearing gate is the proxy.test passthrough assertion, which holds). Recommend updating REQUIREMENTS.md wording to match the implemented STANDALONE_PATHS-skip decision. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/lib/md-serializer.ts | 192, 197 | Stale `.md` suffix on related-links — points to dead 404 URLs after Option C (`/index.md` is the live form) | ⚠️ Warning | In-body cross-links inside service-detail `.md` twins are dead. Untested code path. Does not break twin route serving or any success criterion. |

No TODO/FIXME/XXX/PLACEHOLDER debt markers, no empty-implementation stubs, no console.log-only handlers found in phase files.

### Human Verification Required

1. **Stale related-links in service-detail twins** — Decide whether to fix `renderServiceMd` lines 192/197 (`.md` → `/index.md`) now or accept as low-impact (crawlers still reach canonical via the llms.txt `/index.md` index).
   - Expected: 2-line fix, or explicit accept.
   - Why human: priority/severity is a product call.

### Gaps Summary

No gaps block the phase goal. All three ROADMAP success criteria and the EXP-03 requirement are satisfied in code, with both load-bearing merge gates (proxy passthrough, D-02 coverage parity) passing and verified against the actual on-disk handlers. The two architectural deviations (home literal folders; Option C `/index.md` slug twins) are real on disk, correct, and consistent with the proxy dot-rule. One non-blocking content defect (stale `.md` related-links in `renderServiceMd`) and one documentation drift (REQUIREMENTS.md still cites STANDALONE_PATHS registration) are surfaced for a developer decision but do not affect goal achievement.

---

_Verified: 2026-06-25T17:03:00Z_
_Verifier: Claude (gsd-verifier)_
