# Phase 1: Foundation Prerequisites - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Three cheap, high-leverage prerequisites that unblock all later schema/content work:

1. **FOUND-01** — `JsonLd.tsx` escapes `<` before `dangerouslySetInnerHTML`, so no injected markup can break out of the `<script>` tag.
2. **FOUND-02** — One canonical NAP (name, address, phone, hours) source of truth feeding both schema builders and visible copy; byte-identical sitewide.
3. **FOUND-03** — `robots.txt` explicitly allows AI crawlers, and a live-site audit confirms no CDN/WAF-layer block of AI user-agents.

This phase clarifies HOW to implement FOUND-01/02/03. New capabilities (schema wiring, content, llms.txt, analytics) belong to Phases 2–3.

</domain>

<decisions>
## Implementation Decisions

### Business Identity (NAP truth)
- **D-01:** Canonical business identity is what the **live code already holds**, NOT the planning docs. Canonical = **"Sans Souci Ongles & Spa"**, **CF Carrefour Laval**, **3035 Boulevard le Carrefour, Entrée 6, Laval, QC H7T 1C8**, geo `45.5703, -73.7515`, phone `(450) 505-6450` / `tel:+14505056450`. Evidence: `src/lib/site.ts`, social handles `sans.souci.cflaval`, domain `onglessanssouci.com`.
- **D-02:** Planning docs are **wrong** — PROJECT.md and ROADMAP.md describe "Ongles Sans Souci" / "Montreal." This is doc drift, not a business move. **Correct the planning docs (name + city) to match the code** as part of this phase. Any "Montreal local page" framing in Phase 2 must be re-read as **Laval** (revisit at Phase 2 transition).

### NAP Source of Truth (FOUND-02)
- **D-03:** **`src/lib/site.ts` stays the single source of truth.** It already centralizes name/url/phone/phoneHref/structured-address/structured-hours (schema.org `Mo/Tu` codes + 24h `HH:MM` for `OpeningHoursSpecification`). Do NOT create a separate `nap.ts` data file — that would split business facts and churn every current consumer.
- **D-04:** **Amend the roadmap success criterion.** FOUND-02's literal "a `src/lib/nap.ts` constants file exists" was written before discovery that `site.ts` already does this. New definition of done: *`site.ts` is the sole NAP source; a repo grep finds NAP literals nowhere else.*
- **D-05:** Implementation = **audit + dedupe**. Grep the repo (components, `Footer`, contact page, dictionaries, `seo.ts`) for stray hardcoded phone/address/hours literals; route every one through `site.ts`.
- **D-06:** **Add a grep-based guard unit test** (vitest) that fails if NAP literals (phone number, street, postal code) appear in any file other than `src/lib/site.ts`. Mirrors the codebase's existing merge-gate test culture (the `STANDALONE_PATHS` assertion pattern in `src/proxy.test.ts`; CONCERNS.md recommends parametrized guard tests).

### robots.txt AI-Bot Directives (FOUND-03, code portion)
- **D-07:** Emit **explicit `Allow` directives** for the full named AI-bot set, keep the `*` wildcard fallback, keep the `/api/` disallow. Bots to name:
  - Crawlers (train/index): **GPTBot, ClaudeBot, Google-Extended**
  - Answer-time fetchers (cite live — highest GEO leverage): **ChatGPT-User, OAI-SearchBot, PerplexityBot, Perplexity-User, Claude-User**
- **D-08:** Use Next.js `MetadataRoute.Robots` with an **array of rules** (per-agent blocks + the wildcard) in `src/app/robots.ts`.
- **D-09:** **Add a robots test** asserting each named agent is present and allowed, `/api/` stays disallowed, and `sitemap`/`host` are emitted.

### JSON-LD Escaping (FOUND-01)
- **D-10:** Locked by roadmap. In `src/components/JsonLd.tsx`, escape the serialized payload (`JSON.stringify(data).replace(/</g, "\\u003c")`) before `dangerouslySetInnerHTML`. Defensive now (payload is dictionary-driven today), mandatory before any admin-editable schema content lands.
- **D-11:** **Add a unit test** proving a `</script>`-style payload cannot break out of the script block after escaping.

### Crawler-Access Audit (FOUND-03, verification portion)
- **D-12:** Build a **re-runnable script** `scripts/audit-crawler-access.mjs` that curls the live `onglessanssouci.com` with each AI bot user-agent and asserts HTTP 200. Run it during the phase to capture a baseline.
- **D-13:** **Remediation scope split** — robots/code-fixable findings are fixed in-phase. A CDN / WAF / Dokploy-layer block is **flagged as a separate infra task and escalated**, never silently worked around (it's outside application-code scope).

### Claude's Discretion
- Exact escape breadth in `JsonLd.tsx` beyond `<` (e.g. also handling \u2028/\u2029 line separators) — Claude may add if low-cost, but `<` is the contract.
- Grep mechanics of the NAP guard test (regex vs string scan, which dirs) — Claude decides, as long as it fails on stray literals.
- Shape/output format of `audit-crawler-access.mjs` (table vs JSON) — Claude decides; must exit non-zero on a non-200.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files modified/created this phase
- `src/components/JsonLd.tsx` — JSON-LD inlining (FOUND-01 target).
- `src/lib/site.ts` — the NAP source of truth (FOUND-02 home); already holds structured hours + address.
- `src/app/robots.ts` — current bare-wildcard robots (FOUND-03 target).
- `src/proxy.test.ts` — existing guard-test pattern to mirror for the NAP + robots tests.
- `scripts/audit-crawler-access.mjs` — to be created (FOUND-03 verification).

### Schema consumers (read to scope the NAP dedupe)
- `src/lib/seo.ts` — schema.org builders that consume NAP (NailSalon/LocalBusiness, PostalAddress, OpeningHoursSpecification). Confirm they read from `site.ts`.

### Planning + project docs
- `.planning/REQUIREMENTS.md` §Foundation — FOUND-01/02/03 wording (note: FOUND-02 criterion amended per D-04).
- `.planning/ROADMAP.md` — Phase 1 entry + success criteria (note: NAP criterion amended; Montreal→Laval correction per D-02).
- `.planning/PROJECT.md` — contains the wrong "Montreal"/"Ongles Sans Souci" identity; correct per D-01/D-02.
- `.planning/codebase/CONCERNS.md` — XSS/CSP note on `JsonLd.tsx`; `STANDALONE_PATHS` coupling; guard-test recommendations.
- `.planning/codebase/CONVENTIONS.md` — naming, immutability (`as const`), `UPPERCASE_SNAKE_CASE` constants, co-located `.test.ts`, named exports.
- `.planning/codebase/STRUCTURE.md` §"Where to Add New Code" — utility + test placement rules.

### Project memory
- `standalone-route-proxy-coupling` — any new non-`[lang]` route needs a `STANDALONE_PATHS` entry + `proxy.test.ts` assertion (not triggered this phase — no new routes — but the test-gate discipline informs D-06/D-09).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/lib/site.ts`** — already a documented, locale-invariant SoT with `as const` typing, structured `hours` (schema.org day codes + 24h times) and structured `address`. FOUND-02 is mostly *already satisfied*; work is audit/dedupe + a guard test, not new infrastructure.
- **`src/proxy.test.ts`** — concrete model for a repo-grep / assertion guard test (the NAP and robots tests follow this shape).
- **`src/lib/seo.ts`** — existing schema builders; the NAP audit confirms they source from `site.ts`.

### Established Patterns
- Constants live at module top, `UPPERCASE_SNAKE_CASE`, exported `as const` (CONVENTIONS.md).
- Tests co-located, vitest + jsdom; merge-gate guard tests are an accepted pattern.
- `robots.ts`/`sitemap.ts` are Next.js special files returning `MetadataRoute.*`; `robots` supports an **array of per-agent rules**.
- Immutability throughout (spread, `as const`); no mutation.

### Integration Points
- `robots.ts` already imports `site.url` — extending it stays self-contained.
- `JsonLd.tsx` is a one-function server component; the escape is a single, isolated line + test.
- The NAP guard test plugs into the existing vitest suite; the crawler script is standalone under `scripts/` (alongside `fetch-google-reviews.mjs`).

</code_context>

<specifics>
## Specific Ideas

- Prefer the **answer-time fetcher** bots (ChatGPT-User, Perplexity-User, OAI-SearchBot, Claude-User) be named explicitly — they drive live citations, the milestone's core value.
- The crawler-access script must be **re-runnable** (not a one-shot), so future deploys can re-verify bot 200s.
- All guard/robots/escape work should produce **failing-test-first** artifacts (TDD), consistent with project rules.

</specifics>

<deferred>
## Deferred Ideas

- **CSP header rollout** — explicitly out of scope (tracked in codebase CONCERNS as a broader security task; REQUIREMENTS.md Out-of-Scope). The `<` escape is the only FOUND-01 hardening this phase.
- **CDN/WAF reconfiguration** — if the crawler audit (D-12) finds an edge-layer block, it is escalated as a standalone infra task (D-13), not built here.
- **"Montreal local page" (Phase 2)** — must be reconciled to **Laval** at the Phase 2 transition given the identity correction (D-02). Noted so it isn't lost.

</deferred>

---

*Phase: 1-Foundation Prerequisites*
*Context gathered: 2026-06-17*
