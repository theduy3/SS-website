---
phase: 04
slug: content-expansion
status: secured
threats_open: 0
threats_closed: 12
asvs_level: 1
block_on: high
created: 2026-06-23
---

# SECURITY — Phase 04 (content-expansion)

**Audited:** 2026-06-23
**ASVS Level:** 1
**block_on:** high
**Register authored at plan time:** true (verification audit, not new-threat scan)
**Verdict:** SECURED — 12/12 threats resolved (9 mitigate CLOSED, 3 accept documented below, 1 n/a CLOSED)

The register below was authored during planning. This audit verifies each declared
mitigation exists in the implemented code. Implementation files were not modified.

## Threat Verification

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-04-01 | Tampering (XSS) | mitigate | CLOSED | productGraph/reviewGraph/articleGraph (seo.ts:287,311,331) all return plain object literals — no `JSON.stringify`/`dangerouslySetInnerHTML`/independent sink. All render via `JsonLd` (JsonLd.tsx:21) which applies `.replace(/</g, "\\u003c")` before inlining. |
| T-04-02 | Info disclosure | mitigate | CLOSED | reviewGraph gated: `if (!reviewsFetchedAt) return null` (seo.ts:313). reviewsFetchedAt sourced from `data.fetchedAt`, null in committed scaffold (reviews.ts:28). No self-authored/placeholder rating emitted. |
| T-04-03 | Tampering (stale data) | mitigate | CLOSED | `[PRICE:*]` gate scans `JSON.stringify([en,fr,es,ar])` against `new RegExp("\\[PRICE:[^\\]]+\\]")` (price-tokens.test.ts:26,30-31). `bun run test` passes live (1 passed); grep for `PRICE:` in dictionaries returns no match — no unfilled tokens. |
| T-04-04 | Tampering (XSS) | mitigate | CLOSED | Comparison route renders productGraph + reviewGraph exclusively through `<JsonLd>` (comparisons/[slug]/page.tsx:67-74). Same escape sink as T-04-01. No new serialization sink. |
| T-04-05 | Info disclosure | mitigate | CLOSED | Comparison page mounts `<JsonLd data={reviewGraph(lang)} />` (page.tsx:74); reviewGraph gates on reviewsFetchedAt (seo.ts:313) and JsonLd no-ops on null (JsonLd.tsx:14). |
| T-04-06 | Repudiation (false claims) | accept | DOCUMENTED | See Accepted Risks AR-1. |
| T-04-07 | Tampering (XSS) | mitigate | CLOSED | Guide route renders articleGraph through `<JsonLd>` (guides/[slug]/page.tsx:61-67). Same escape sink. No new sink. |
| T-04-08 | Tampering (stale price) | mitigate | CLOSED | Same gate as T-04-03. Prices filled ($30/$40 etc.); gate is GREEN — `bun run test` passes live. |
| T-04-09 | Info disclosure | accept | DOCUMENTED | See Accepted Risks AR-2. |
| T-04-10 | Tampering (broken links) | mitigate | CLOSED | sitemap.ts templates every comparison/guide URL through `comparisonPath(cmp, locale)` / `guidePath(guide, locale)` (sitemap.ts:88,99,101,109,117,119); llms.txt uses the same helpers (route.ts:87,92). No hand-typed slugs. |
| T-04-11 | Info disclosure | accept | DOCUMENTED | See Accepted Risks AR-3. |
| T-04-SC | Tampering (supply chain) | n/a | CLOSED | `git diff --stat 3ed7bb6..HEAD -- package.json bun.lock` is empty — no dependency changes this phase. |

## Accepted Risks Log

### AR-1 — T-04-06: category-alternative copy makes self-favoring claims
**Category:** Repudiation (false claims) · **Disposition:** accept
Comparison copy is salon-vs-DIY framing only (D-02/D-03). No named competitor salons; verdicts
use neutral "home kit / salon / DIY / professional" framing (VERIFICATION.md D-02 row: no brand
names). Honest/neutral, no third party to defame. Accepted: reputational risk of self-favoring
comparison copy is inherent to marketing content and bounded by the no-named-rivals constraint.

### AR-2 — T-04-09: guide/comparison route 404 path leaks state
**Category:** Info disclosure · **Disposition:** accept
Routes are static content guarded cleanly: `if (!isLocale(lang)) notFound()` and
`if (!guide) notFound()` (guides/[slug]/page.tsx:45-47; mirror in comparisons route 51-53).
A wrong-locale or unknown slug 404s with no state leak. generateStaticParams emits only the
current locale's slugs (page.tsx:25-28). Accepted: 404 on bad input is the intended, information-free behavior.

### AR-3 — T-04-11: llms.txt curated brief exposes internal routes
**Category:** Info disclosure · **Disposition:** accept
llms.txt (llms.txt/route.ts) lists only public marketing pages — services, faq, laval, contact,
plus comparisons/guides via path helpers. Grep for admin/api/internal/kiosk routes returns none.
Content sourced exclusively from site.ts (D-08). Accepted: the brief is public-by-design and
contains no internal/admin surface.

## Unregistered Flags

None. No `## Threat Flags` section is present in any 04-0{1,2,3,4}-SUMMARY.md (grep exit 1) —
no new attack surface was flagged by the executor during implementation.

## Cross-checks (constraints)

- JsonLd escape path actually escapes `<`: CONFIRMED (`.replace(/</g, "\\u003c")`, JsonLd.tsx:21).
- reviewGraph returns null when reviewsFetchedAt falsy: CONFIRMED (seo.ts:313).
- No /guides or /comparisons in STANDALONE_PATHS: CONFIRMED — `{checkin,queue,clientportal,subscription,llms.txt}` (proxy.ts:13-19); both routes stay locale-gated.
- package.json / bun.lock unchanged this phase: CONFIRMED (empty diff vs 3ed7bb6).
