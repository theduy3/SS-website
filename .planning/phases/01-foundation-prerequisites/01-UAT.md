---
status: complete
phase: 01-foundation-prerequisites
source: [01-VERIFICATION.md]
started: 2026-06-18T01:01:43Z
updated: 2026-06-18T01:24:00Z
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
awaiting: none — passed (deployed and confirmed live 2026-06-18)

## Tests

### 1. Deployed robots.txt serves explicit AI-bot allow rules
expected: After merge-to-main auto-deploy, `curl -s https://onglessanssouci.com/robots.txt` shows explicit allow blocks for GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot (and the other named AI bots), `User-agent: *` retains `Disallow: /api/`, and Sitemap + Host are present.
result: pass
evidence: "2026-06-18 — pushed Phase 1 to origin/main; Dokploy deployed in ~100s. `curl -s https://onglessanssouci.com/robots.txt` returns explicit blocks for GPTBot, ClaudeBot, Google-Extended, ChatGPT-User, OAI-SearchBot, PerplexityBot, Perplexity-User, Claude-User (each Allow: /), `User-Agent: *` with `Disallow: /api/`, plus `Host:` and `Sitemap:`. Matches robots.ts contract exactly."

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
