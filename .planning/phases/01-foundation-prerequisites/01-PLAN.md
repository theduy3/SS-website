---
phase: 01-foundation-prerequisites
plan: 01
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/components/JsonLd.tsx
  - src/components/JsonLd.test.tsx
  - src/lib/site.test.ts
  - src/app/robots.ts
  - src/app/robots.test.ts
  - scripts/audit-crawler-access.mjs
  - .planning/PROJECT.md
  - .planning/ROADMAP.md
  - .planning/REQUIREMENTS.md
autonomous: false
requirements: [FOUND-01, FOUND-02, FOUND-03]
must_haves:
  truths:
    - "A `</script>`-bearing payload passed to JsonLd cannot break out of the script tag (escaped to \\u003c)"
    - "A guard test fails the suite if a NAP literal (phone, street, postal code) appears in any .ts/.tsx code file other than src/lib/site.ts"
    - "robots output names every required AI bot with an explicit allow, keeps the * wildcard, keeps /api/ disallowed, and emits sitemap + host"
    - "Planning docs (PROJECT.md, ROADMAP.md) state the correct identity: Sans Souci Ongles & Spa, Laval (not Ongles Sans Souci / Montreal)"
    - "A re-runnable script curls the live site per AI user-agent and exits non-zero on any non-200"
  artifacts:
    - path: "src/components/JsonLd.tsx"
      provides: "JSON-LD inlining with < escaped to \\u003c before dangerouslySetInnerHTML"
      contains: "\\\\u003c"
    - path: "src/components/JsonLd.test.tsx"
      provides: "Escape proof: </script> payload cannot break out"
    - path: "src/lib/site.test.ts"
      provides: "Grep-based NAP single-source-of-truth guard test"
    - path: "src/app/robots.ts"
      provides: "MetadataRoute.Robots array-of-rules with named AI bots"
      contains: "GPTBot"
    - path: "src/app/robots.test.ts"
      provides: "Robots rule assertions (named bots allowed, /api/ disallowed, sitemap+host)"
    - path: "scripts/audit-crawler-access.mjs"
      provides: "Re-runnable live crawler-access audit; non-zero exit on non-200"
  key_links:
    - from: "src/app/robots.ts"
      to: "src/lib/site.ts"
      via: "import { site }"
      pattern: "site\\.url"
    - from: "src/lib/seo.ts"
      to: "src/lib/site.ts"
      via: "all NAP fields read from site (already wired — guard test protects this)"
      pattern: "site\\.contact\\.address"
---

<objective>
Land the three foundation prerequisites (FOUND-01/02/03) that gate all later schema and content work, each as a failing-test-first (RED→GREEN) artifact:

1. **FOUND-01 (D-10/D-11):** Escape `<` to `<` in `JsonLd.tsx` before `dangerouslySetInnerHTML`, proven by a test that feeds a `</script>` payload.
2. **FOUND-02 (D-03/D-04/D-05/D-06 + D-01/D-02):** `src/lib/site.ts` is the SOLE NAP source. Code is already clean (verified: zero NAP literals in any component) — so the deliverable is a grep-based guard test that fails if a NAP literal leaks into any future code file, PLUS correcting the identity drift in the planning docs (Ongles Sans Souci/Montreal → Sans Souci Ongles & Spa/Laval).
3. **FOUND-03 (D-07/D-08/D-09 + D-12/D-13):** Rewrite `robots.ts` to a `MetadataRoute.Robots` array-of-rules naming every required AI bot, with a test; create a re-runnable `scripts/audit-crawler-access.mjs`; run it once to capture a live baseline.

Purpose: Make the JSON-LD output path safe, lock NAP to one source with an enforcement gate, and confirm AI crawlers receive 200s — unblocking Phase 2 schema/content.
Output: 1 escaped component + 3 test files + 1 robots rewrite + 1 audit script + corrected planning docs.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-prerequisites/01-CONTEXT.md
@.planning/codebase/CONVENTIONS.md
@.planning/codebase/CONCERNS.md

# Source files this plan touches or scopes against
@src/components/JsonLd.tsx
@src/lib/site.ts
@src/app/robots.ts
@src/proxy.test.ts
@src/lib/seo.ts

# Project warning — Next.js in this repo is NON-standard
@AGENTS.md
</context>

<phase_goal>
The site's JSON-LD output path is safe, business identity is a single enforced source of truth, and AI crawlers are confirmed to receive 200 responses — unblocking all schema and content work.
</phase_goal>

<artifacts_this_phase_produces>
| Artifact | Type | Requirement | Notes |
|----------|------|-------------|-------|
| `src/components/JsonLd.tsx` (modified) | code | FOUND-01 | `<` → `<` escape line |
| `src/components/JsonLd.test.tsx` (new) | test | FOUND-01 | `</script>` breakout-proof test |
| `src/lib/site.test.ts` (new) | test | FOUND-02 | grep guard: NAP literals only in site.ts |
| `src/app/robots.ts` (modified) | code | FOUND-03 | array-of-rules, named AI bots |
| `src/app/robots.test.ts` (new) | test | FOUND-03 | bot/disallow/sitemap/host assertions |
| `scripts/audit-crawler-access.mjs` (new) | script | FOUND-03 | re-runnable live UA audit, non-zero on non-200 |
| `.planning/PROJECT.md` `.planning/ROADMAP.md` `.planning/REQUIREMENTS.md` (modified) | docs | FOUND-02 (D-02/D-04) | identity drift correction + amend nap.ts criterion |
</artifacts_this_phase_produces>

<critical_constraints>
- **Read first, always:** This repo runs a NON-standard Next.js (see AGENTS.md). Before editing `robots.ts`, READ `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md` to confirm the current `MetadataRoute.Robots` array-of-rules shape and the `rules`/`sitemap`/`host` field contract for THIS version. Do not write robots code from memory.
- **NO `src/lib/nap.ts`** (D-03/D-04). `site.ts` is already the source of truth and `seo.ts` already reads every NAP field from it (verified). Creating nap.ts is forbidden — it would split business facts.
- **Code is already NAP-clean** (verified at plan time: grep finds NAP literals in NO `.ts`/`.tsx` file except `site.ts`). The only literals live in `src/dictionaries/{en,fr,es,ar}.json` inside human-readable localized prose (FAQ answers, privacy text, meta descriptions). Those are legitimate translated sentences, NOT consumers to refactor — interpolating `site.ts` into 4-language grammar would break the copy. The guard test therefore scans CODE files and EXEMPTS the dictionaries and site.ts itself. Do not attempt to dedupe dictionary prose.
- **CSP rollout is OUT OF SCOPE** (deferred). The `<` escape is the only FOUND-01 hardening this phase.
- **Crawler-block remediation scope split (D-13):** if the live audit finds a non-200 caused by a CDN/WAF/Dokploy edge block, that is OUT OF SCOPE — flag and escalate as a separate infra task at the checkpoint. NEVER silently work around an edge-layer block in application code.
- **Immutability + conventions:** `as const`, named exports, co-located `.test.ts`, vitest + jsdom (mirror `src/proxy.test.ts`). No `console.log` in `JsonLd.tsx`/`robots.ts` production code (the audit `.mjs` script may print results — it is a CLI tool, not app code).
</critical_constraints>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Escape JSON-LD output (FOUND-01, D-10/D-11)</name>
  <files>src/components/JsonLd.test.tsx, src/components/JsonLd.tsx</files>
  <read_first>
    - src/components/JsonLd.tsx (current: inlines raw JSON.stringify)
    - src/proxy.test.ts (vitest + jsdom test shape to mirror)
    - vitest.config.ts / vitest.setup.ts (confirm jsdom env + render approach)
  </read_first>
  <behavior>
    - RED: Test renders `<JsonLd data={{ x: "</script><script>alert(1)</script>" }} />`, reads the emitted script element's inner HTML (via renderToStaticMarkup or equivalent SSR string render — JsonLd is a server component, so prefer `react-dom/server` renderToStaticMarkup), and asserts the raw output contains `<` (the escaped form) and does NOT contain a literal `</script>` sequence that would close the tag. This test FAILS against the current unescaped component.
    - Test 2 (round-trip): asserts `JSON.parse` of the de-escaped payload still equals the original object, proving the escape does not corrupt valid JSON-LD.
    - GREEN: change the `__html` value to `JSON.stringify(data).replace(/</g, "\\u003c")`. Update the now-stale comments in the file (they currently claim the raw stringify is safe). Claude's discretion (D-discretion): may additionally escape ` `/` ` line separators if low-cost, but `<` → `<` is the contract.
  </behavior>
  <action>Create `src/components/JsonLd.test.tsx` FIRST with the breakout-proof + round-trip assertions above; run it and confirm RED. Then edit `src/components/JsonLd.tsx`: replace `__html: JSON.stringify(data)` with the `.replace(/</g, "\\u003c")` escaped form per D-10, and correct the misleading "safe to inline / no untrusted data" comments to reflect the defensive escape. Implements D-10, D-11.</action>
  <verify>
    <automated>bun run test -- src/components/JsonLd.test.tsx</automated>
  </verify>
  <done>Test file existed and failed before the edit (RED), passes after (GREEN); `JsonLd.tsx` contains `.replace(/</g, "\\u003c")`; a `</script>` payload cannot close the script tag.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: NAP single-source guard test + correct planning-doc identity drift (FOUND-02, D-01/D-02/D-04/D-05/D-06)</name>
  <files>src/lib/site.test.ts, .planning/PROJECT.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md</files>
  <read_first>
    - src/lib/site.ts (the source of truth — name, phone, phoneHref, structured address, hours)
    - src/lib/seo.ts (confirm it reads NAP from `site.*` — it does; the guard protects this)
    - src/proxy.test.ts (guard-test shape to mirror)
    - .planning/PROJECT.md lines 1, 5, 45, 60, 82, 90 (identity drift: "Ongles Sans Souci", "Montreal")
    - .planning/ROADMAP.md (Phase 1 success criterion #2 mentions nap.ts; Phase 2 "Montreal local page")
  </read_first>
  <behavior>
    - RED-then-GREEN guard: write a vitest test in `src/lib/site.test.ts` that reads the repo's CODE files (`src/**/*.ts` and `src/**/*.tsx`) from disk using `fs` + a glob/recursive walk, and asserts that the NAP literals — phone `(450) 505-6450`, phone digits `+14505056450`, street `3035 Boulevard le Carrefour`, postal `H7T 1C8` — appear in NO file except `src/lib/site.ts`. EXEMPT from the scan: `src/lib/site.ts` itself, all `src/dictionaries/**` (localized prose — legitimate), and any `*.test.ts`/`*.test.tsx` (tests reference the literals by design). Use a filtered scan so comments/strings count (we want ANY occurrence in code to fail). The test PASSES today (code is clean) and will FAIL the day someone hardcodes a NAP literal into a component — that is its purpose (a regression gate, per CONCERNS.md parametrized-guard-test recommendation). Grep mechanics (regex vs string scan, which dirs) are Claude's discretion per D-discretion, as long as it fails on a stray literal in code.
    - Add one positive assertion that `site.ts` DOES contain each literal (proves the SoT is the one allowed home and the exemption list is honest).
  </behavior>
  <action>Create `src/lib/site.test.ts` implementing the grep guard above (scan code, exempt site.ts + dictionaries + test files), per D-06. Confirm it passes (code is already clean per D-05 audit). Then correct the planning-doc identity drift per D-01/D-02: in `.planning/PROJECT.md` change "Ongles Sans Souci" → "Sans Souci Ongles & Spa" and "Montreal" → "Laval" (lines ~1, 5, 45, 60, 82, 90 — surgical, name+city only, no other rewrites); in `.planning/ROADMAP.md` amend Phase 1 success criterion #2 to drop the `src/lib/nap.ts` requirement and restate it as "`src/lib/site.ts` is the sole NAP source; grep finds NAP literals in no other code file" (D-04), and add a note on the Phase 2 "Montreal local page" line that it reconciles to Laval at the Phase 2 transition; in `.planning/REQUIREMENTS.md` leave FOUND-02 wording but the traceability stays. This is doc-only — no business change.</action>
  <verify>
    <automated>bun run test -- src/lib/site.test.ts</automated>
  </verify>
  <done>Guard test passes (NAP literals confined to site.ts among code files; dictionaries exempt); PROJECT.md and ROADMAP.md no longer say "Ongles Sans Souci" or describe the salon as Montreal; ROADMAP Phase 1 criterion #2 no longer requires nap.ts. Verify docs: `grep -c "Ongles Sans Souci\\|Montreal nail" .planning/PROJECT.md` returns 0.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: robots.ts AI-bot rules + test + re-runnable crawler audit script (FOUND-03, D-07/D-08/D-09/D-12)</name>
  <files>src/app/robots.test.ts, src/app/robots.ts, scripts/audit-crawler-access.mjs</files>
  <read_first>
    - node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md (MANDATORY — confirm array-of-rules shape for THIS Next.js version before writing)
    - src/app/robots.ts (current: single wildcard rule, imports site.url)
    - src/lib/site.ts (site.url)
    - scripts/fetch-google-reviews.mjs (sibling .mjs style/conventions for the audit script)
    - src/proxy.test.ts (test shape)
  </read_first>
  <behavior>
    - RED: write `src/app/robots.test.ts` that imports the default `robots()` function and asserts on its returned object:
      (a) every named bot has a rule with `allow: "/"` — Crawlers: GPTBot, ClaudeBot, Google-Extended; Answer-time fetchers: ChatGPT-User, OAI-SearchBot, PerplexityBot, Perplexity-User, Claude-User (D-07);
      (b) the `*` wildcard rule still exists with `allow: "/"` and `disallow` including `/api/`;
      (c) `result.sitemap` equals `${site.url}/sitemap.xml` and `result.host` equals `site.url` (D-09).
      Iterate the named-bot list parametrically (loop over the expected agents). This FAILS against the current single-wildcard robots.
    - GREEN: rewrite `robots()` to return `rules` as an ARRAY of per-agent objects + the wildcard, using the exact field shape confirmed from the Next.js docs (D-08). Keep importing `site` for url/sitemap/host. Keep `/api/` disallowed on the wildcard.
  </behavior>
  <action>FIRST read the Next.js robots doc to confirm the `MetadataRoute.Robots` `rules: []` array contract. Create `src/app/robots.test.ts` with the parametric assertions above and confirm RED. Rewrite `src/app/robots.ts` to emit an array of rules naming all 9 AI bots (3 crawlers + 6 answer-time, per D-07) each allowing `/`, plus the `*` wildcard allowing `/` and disallowing `/api/`, with `sitemap` and `host` from `site` (D-08). THEN create `scripts/audit-crawler-access.mjs` (D-12): a re-runnable Node script (mirror `scripts/fetch-google-reviews.mjs` conventions) that fetches `https://onglessanssouci.com/en` once per AI user-agent string (the same 9 bots), records HTTP status per UA, prints a result table/JSON (Claude's discretion on format), and `process.exit(1)` if ANY response is not 200. Add a `package.json` script entry `"audit:crawlers": "node scripts/audit-crawler-access.mjs"` mirroring the existing `fetch:reviews` entry. Do NOT run the live script here (that happens at the checkpoint).</action>
  <verify>
    <automated>bun run test -- src/app/robots.test.ts</automated>
  </verify>
  <done>robots test passes; `robots.ts` returns an array of rules naming all 9 AI bots + wildcard, with `/api/` disallowed and sitemap+host emitted; `scripts/audit-crawler-access.mjs` exists, is executable via `node`, and has a `package.json` audit:crawlers script.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Run live crawler-access baseline + escalate any edge-layer block (FOUND-03, D-12/D-13)</name>
  <files>scripts/audit-crawler-access.mjs (executed, not modified)</files>
  <action>Run the live crawler-access audit (`bun run audit:crawlers`) to capture a FOUND-03 baseline against the deployed onglessanssouci.com/en. Per D-12 this is a human-verify checkpoint because the result depends on live edge/WAF behavior. Per D-13, if any AI user-agent returns a non-200 caused by a CDN/WAF/Dokploy edge block, escalate it as a separate infra task and do NOT work around it in application code.</action>
  <what-built>
    `scripts/audit-crawler-access.mjs` — curls the LIVE `onglessanssouci.com/en` once per AI user-agent (GPTBot, ClaudeBot, Google-Extended, ChatGPT-User, OAI-SearchBot, PerplexityBot, Perplexity-User, Claude-User), asserts HTTP 200, exits non-zero on any non-200. Also: the new `robots.ts` is NOT yet deployed — this baseline measures the CURRENTLY live edge/WAF behavior, which is the FOUND-03 verification target (a robots allow cannot fix a 403/429 from a CDN/WAF layer).
  </what-built>
  <how-to-verify>
    1. Run: `bun run audit:crawlers` (or `node scripts/audit-crawler-access.mjs`).
    2. Expected: every listed AI user-agent returns HTTP 200 from the live site; script exits 0 and prints the per-UA table.
    3. If the script exits non-zero (some UA got 403/429/5xx): this indicates a CDN / WAF / Dokploy edge-layer block of AI crawlers. Per D-13 this remediation is OUT OF SCOPE for this code phase — capture the failing user-agents + status codes in the SUMMARY and ESCALATE as a separate infra task (note it as a blocker; do NOT attempt to work around it in application code).
    4. Paste the audit output (or confirm all-200) to resume.
  </how-to-verify>
  <acceptance_criteria>
    Live baseline captured. Either: all 9 AI UAs return 200 (FOUND-03 confirmed, no infra block) — OR — non-200s are documented with exact UA+status and flagged for a separate infra escalation task. Either outcome is a valid completion of the audit; the phase does not silently pass over a block.
  </acceptance_criteria>
  <resume-signal>Type "approved" (all 200) or paste the non-200 user-agents to be escalated.</resume-signal>
  <verify><human-check>Live audit run; every AI UA returned 200, OR non-200s documented with UA+status and flagged for infra escalation.</human-check></verify>
  <done>Live crawler baseline captured. All 9 AI UAs return 200 (FOUND-03 confirmed) OR non-200s recorded in SUMMARY and escalated as a separate infra task. No silent workaround.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| schema data → inlined `<script>` JSON-LD | Today the payload is dictionary/builder-driven (our own data), but it crosses into raw HTML via `dangerouslySetInnerHTML`. Becomes untrusted the moment any admin-editable or fetched content (e.g. Google reviews text) flows into a schema builder. |
| AI crawler UA → live edge (CDN/WAF/Dokploy) → app | External bots hit the public origin; an edge layer may block or rate-limit by user-agent before the app/robots is ever consulted. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Tampering (HTML/JS injection / stored XSS) | `src/components/JsonLd.tsx` `dangerouslySetInnerHTML` | mitigate | Escape `<` → `<` before inlining (D-10); unit test feeds a `</script>` payload and asserts it cannot close the tag (D-11). ASVS L1 output-encoding for HTML context. |
| T-01-02 | Information disclosure / Spoofing (NAP drift across surfaces) | NAP literals duplicated in code | mitigate | Single-source `site.ts` + grep guard test (D-06) fails the build if a literal leaks into any code file, preventing divergent/incorrect business facts being served. |
| T-01-03 | Denial of service / Repudiation (silent crawler block) | live edge layer vs AI UAs | mitigate (detect) / transfer | Re-runnable audit script (D-12) detects non-200s per UA and exits non-zero; edge-layer remediation transferred to a separate infra task (D-13), never silently swallowed. |
| T-01-SC | Tampering | npm/pip/cargo installs | mitigate | No new package installs in this phase (escape, guard test, robots rewrite, and audit script all use existing deps: vitest, node fetch, next). No package legitimacy gate required. If any task discovers a needed dependency, STOP and add a blocking checkpoint. |

CSP header rollout (a stronger T-01-01 defense-in-depth) is explicitly DEFERRED (REQUIREMENTS.md Out-of-Scope); the `<` escape is the contracted mitigation this phase.
</threat_model>

<verification>
Phase-level checks (map to amended ROADMAP success criteria):

1. **FOUND-01:** `bun run test -- src/components/JsonLd.test.tsx` green; `grep -c '\\\\u003c' src/components/JsonLd.tsx` ≥ 1.
2. **FOUND-02 (amended per D-04):** `bun run test -- src/lib/site.test.ts` green (NAP literals confined to `site.ts` among code files, dictionaries exempt); `grep -rln "505-6450\\|3035 Boulevard\\|H7T 1C8" src --include=*.ts --include=*.tsx | grep -v site.ts | grep -v dictionaries` returns nothing; PROJECT.md identity corrected (`grep -c "Montreal nail\\|Ongles Sans Souci" .planning/PROJECT.md` == 0).
3. **FOUND-03:** `bun run test -- src/app/robots.test.ts` green (9 named bots allowed, `/api/` disallowed, sitemap+host emitted); `scripts/audit-crawler-access.mjs` exists and the live baseline (Task 4) is captured (all-200, or non-200s escalated).
4. **Full suite regression:** `bun run test` green (no existing test broken).
</verification>

<success_criteria>
- [ ] `JsonLd.tsx` escapes `<` → `<`; `</script>` breakout test passes (FOUND-01 / D-10 / D-11)
- [ ] `site.test.ts` guard passes; NAP literals exist in no code file but `site.ts` (FOUND-02 / D-03 / D-05 / D-06)
- [ ] Planning docs corrected: Sans Souci Ongles & Spa / Laval; nap.ts criterion amended (D-01 / D-02 / D-04)
- [ ] `robots.ts` array-of-rules names all 9 AI bots + wildcard, `/api/` disallowed, sitemap+host emitted; test passes (FOUND-03 / D-07 / D-08 / D-09)
- [ ] `scripts/audit-crawler-access.mjs` is re-runnable and exits non-zero on non-200 (D-12)
- [ ] Live crawler baseline captured; any edge-layer block escalated, not worked around (D-13)
- [ ] Full vitest suite green; no new packages installed
</success_criteria>

<source_audit>
## Multi-Source Coverage Audit

| Source | Item | Covered by |
|--------|------|------------|
| GOAL | JSON-LD output path safe | Task 1 |
| GOAL | Business identity single source of truth | Task 2 |
| GOAL | AI crawlers confirmed 200 | Task 3 + Task 4 |
| REQ | FOUND-01 (escape `<`) | Task 1 |
| REQ | FOUND-02 (single NAP source) | Task 2 |
| REQ | FOUND-03 (robots allows AI bots + audit) | Task 3 + Task 4 |
| CONTEXT | D-01 (canonical identity = live code) | Task 2 (doc correction baseline) |
| CONTEXT | D-02 (correct planning-doc drift) | Task 2 |
| CONTEXT | D-03 (site.ts stays SoT, no nap.ts) | Task 2 (constraint honored) |
| CONTEXT | D-04 (amend roadmap criterion) | Task 2 |
| CONTEXT | D-05 (audit + dedupe; code already clean) | Task 2 |
| CONTEXT | D-06 (grep guard test) | Task 2 |
| CONTEXT | D-07 (explicit allow per named bot) | Task 3 |
| CONTEXT | D-08 (MetadataRoute.Robots array) | Task 3 |
| CONTEXT | D-09 (robots test) | Task 3 |
| CONTEXT | D-10 (escape line) | Task 1 |
| CONTEXT | D-11 (escape unit test) | Task 1 |
| CONTEXT | D-12 (re-runnable audit script) | Task 3 (build) + Task 4 (run) |
| CONTEXT | D-13 (remediation scope split / escalate) | Task 4 |
| CONTEXT | Discretion (escape breadth, grep mechanics, audit format) | Tasks 1/2/3 (noted) |
| RESEARCH | n/a (no RESEARCH.md for this phase) | — |

**Exclusions (not gaps):** CSP rollout (deferred), CDN/WAF reconfiguration (escalated per D-13), Montreal→Laval Phase 2 page reconciliation (deferred to Phase 2 transition). No MISSING items.
</source_audit>

<output>
Create `.planning/phases/01-foundation-prerequisites/01-01-SUMMARY.md` when done. Record: the live crawler-audit baseline result (all-200 or the escalated non-200 UAs), and confirmation that no nap.ts was created.
</output>
