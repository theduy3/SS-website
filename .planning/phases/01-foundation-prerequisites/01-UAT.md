---
status: testing
phase: 01-foundation-prerequisites
source: [01-VERIFICATION.md]
started: 2026-06-18T01:01:43Z
updated: 2026-06-18T01:01:43Z
---

## Current Test

number: 1
name: Deployed robots.txt serves explicit AI-bot allow rules
expected: |
  After the Phase 1 commits merge to main and Dokploy auto-deploys, the live
  robots.txt reflects the new array-of-rules (not the old single wildcard).
  `curl -s https://onglessanssouci.com/robots.txt` shows explicit Allow blocks
  for GPTBot, ClaudeBot, OAI-SearchBot, and PerplexityBot (plus Google-Extended,
  ChatGPT-User, Perplexity-User, Claude-User), keeps `User-agent: *` with
  `Disallow: /api/`, and emits Sitemap + Host.
awaiting: deploy (Phase 1 commits unpushed; live robots.txt still old wildcard)

## Tests

### 1. Deployed robots.txt serves explicit AI-bot allow rules
expected: After merge-to-main auto-deploy, `curl -s https://onglessanssouci.com/robots.txt` shows explicit allow blocks for GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot (and the other named AI bots), `User-agent: *` retains `Disallow: /api/`, and Sitemap + Host are present.
result: blocked
blocked_by: deploy
reason: "Verified 2026-06-18 — Phase 1 is 17 commits ahead of origin/main (unpushed); live robots.txt still serves the old single `User-agent: *` wildcard. Not a code defect: robots.ts is committed, 13 robots tests green, and the live crawler audit already returned HTTP 200 for all 8 AI UAs. Blocked on deploy: push/merge Phase 1 to origin/main → Dokploy auto-deploys → re-run /gsd-verify-work 1."
note: Code + 13 robots tests already pass; live audit (`bun run audit:crawlers`) already returned HTTP 200 for all 8 AI UAs against onglessanssouci.com/en. The ONLY open item is that robots.ts is committed but not yet deployed — this check confirms the deploy landed. A robots Allow cannot fix an edge/WAF 403, but the audit already proved no edge block exists.

## Summary

total: 1
passed: 0
issues: 0
pending: 0
skipped: 0
blocked: 1

## Gaps
