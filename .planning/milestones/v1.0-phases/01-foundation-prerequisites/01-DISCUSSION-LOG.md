# Phase 1: Foundation Prerequisites - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 1-Foundation Prerequisites
**Areas discussed:** Business identity truth, NAP source of truth, NAP guard, robots AI-bot directives, Crawler-access audit

---

## Business Identity Truth

| Option | Description | Selected |
|--------|-------------|----------|
| Code is right: Laval | Canonical = "Sans Souci Ongles & Spa", CF Carrefour Laval, Laval QC. Matches site.ts, social handles, geo. Fix the drifted docs. | ✓ |
| Docs are right: Montreal | Canonical = "Ongles Sans Souci", Montreal. Would mean site.ts is wrong and needs a bigger correction. | |
| Split: legal vs brand | Legal name ≠ display brand and/or city nuance. | |

**User's choice:** Code is right: Laval
**Notes:** All code evidence (site.ts name/address/geo, `sans.souci.cflaval` social handles, domain) agrees on Laval. Planning docs (PROJECT.md, ROADMAP.md) carry the wrong "Montreal"/"Ongles Sans Souci" identity and will be corrected. Phase 2's "Montreal local page" must be re-read as Laval.

---

## NAP Source of Truth

| Option | Description | Selected |
|--------|-------------|----------|
| Keep site.ts + dedupe | site.ts stays SoT; grep + route stray literals through it; amend the roadmap criterion. Least churn. | ✓ |
| nap.ts re-export view | New nap.ts re-exports NAP subset from site.ts; satisfies literal grep, no data duplication. | |
| Move NAP into nap.ts | Physically migrate NAP out of site.ts; most literal, most churn. | |

**User's choice:** Keep site.ts + dedupe
**Notes:** site.ts already centralizes name/url/phone/structured-address/structured-hours. Creating a separate data file would split business facts. FOUND-02's literal "nap.ts exists" criterion is amended to "site.ts is sole NAP SoT; grep finds no duplicates."

---

## NAP Guard

| Option | Description | Selected |
|--------|-------------|----------|
| Guard test | Unit test greps repo, fails if NAP literals appear outside site.ts. Matches merge-gate test culture. | ✓ |
| Manual sweep only | One-time grep + fix, no permanent test. | |

**User's choice:** Guard test
**Notes:** Prevents future hardcoded-number drift; mirrors the STANDALONE_PATHS assertion pattern in proxy.test.ts.

---

## robots AI-Bot Directives

| Option | Description | Selected |
|--------|-------------|----------|
| Full named set + test | Explicit Allow for crawlers (GPTBot, ClaudeBot, Google-Extended) + answer-time fetchers (ChatGPT-User, OAI-SearchBot, PerplexityBot, Perplexity-User, Claude-User); keep wildcard + /api disallow; robots test. | ✓ |
| Criterion's 4 only | Just GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot + wildcard + test. | |
| Wildcard only | Keep bare wildcard, document, amend criterion. | |

**User's choice:** Full named set + test
**Notes:** Answer-time fetchers drive live citations (the milestone's core value), so they're named explicitly alongside the crawlers. robots.ts uses MetadataRoute.Robots array-of-rules.

---

## Crawler-Access Audit

| Option | Description | Selected |
|--------|-------------|----------|
| Script + run now | Re-runnable scripts/audit-crawler-access.mjs curls live site per bot UA, asserts 200; baseline now; robots fixes in-phase, CDN/WAF block escalated as infra task. | ✓ |
| One-time manual | Curl once, paste results, no script. | |
| Document checklist only | Checklist for user to run from external network. | |

**User's choice:** Script + run now
**Notes:** FOUND-03's "external 200 + no WAF block" can't run from the build; live site is public so a script probe is representative and repeatable. Remediation scope is split — code/robots fixes land in-phase, edge-layer (CDN/WAF/Dokploy) blocks are flagged and escalated, never silently worked around.

---

## Claude's Discretion

- Escape breadth in JsonLd.tsx beyond `<` (line separators) — Claude may add if low-cost; `<` is the contract.
- NAP guard test grep mechanics (regex vs string, dirs scanned).
- Output format of audit-crawler-access.mjs (must exit non-zero on a non-200).

## Deferred Ideas

- CSP header rollout — out of scope (broader security task, tracked in codebase CONCERNS + REQUIREMENTS Out-of-Scope).
- CDN/WAF reconfiguration — escalated as infra task only if the crawler audit finds an edge-layer block.
- "Montreal local page" (Phase 2) — reconcile to Laval at the Phase 2 transition.
