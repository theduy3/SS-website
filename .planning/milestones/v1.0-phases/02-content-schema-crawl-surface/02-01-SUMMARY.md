---
phase: "02"
plan: "01"
subsystem: "content-schema"
tags: ["seo", "json-ld", "i18n", "answer-engine", "faq"]
dependency_graph:
  requires: ["01-foundation"]
  provides: ["lead-paragraphs", "servicesGraph-home", "faqPageGraph-service-detail"]
  affects: ["02-02", "02-03"]
tech_stack:
  added: []
  patterns: ["answer-first lead", "ItemList JSON-LD", "FAQPage JSON-LD", "single-source schema/copy (SCHEMA-02)"]
key_files:
  created:
    - src/app/[lang]/page.test.tsx
    - src/app/[lang]/faq/page.test.tsx
  modified:
    - src/dictionaries/en.json
    - src/dictionaries/fr.json
    - src/dictionaries/es.json
    - src/dictionaries/ar.json
    - src/app/[lang]/page.tsx
    - src/app/[lang]/services/page.tsx
    - src/app/[lang]/about/page.tsx
    - src/app/[lang]/faq/page.tsx
    - src/app/[lang]/services/[slug]/page.tsx
decisions:
  - "Lead <p> placed before first <section>, NOT wrapped in <Reveal> (Framer Motion Pitfall 3 — opacity:0 hides from crawlers on first paint)"
  - "Tests import JSON directly rather than via getDictionary() to avoid server-only guard blocking vitest"
  - "Task 3 (faqPageGraph on service detail) committed with Task 2 — both were implemented in the same editing pass"
metrics:
  duration: "~40 minutes"
  completed: "2026-06-17"
  tasks_completed: 3
  files_changed: 11
---

# Phase 02 Plan 01: Answer-First Content Surface Summary

Answer-first lead paragraphs (40-60 words each) added to all 8 dictionary sections across 4 locales; faq.items expanded from 11 to 15 (parking, pricing, online booking, transit); leads wired as plain `<p>` blocks into 6 pages; `servicesGraph` ItemList emitted on home; `faqPageGraph` emitted on each service detail route.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add lead keys + expand faq.items in en/fr/es/ar | 592168c |
| 2 | Wire lead paragraphs + servicesGraph to pages + SSR tests | f785820 |
| 3 | Add faqPageGraph to service detail pages | f785820 (combined with Task 2) |

## Verification

- Dictionary validation script: `dict OK 15` — all 4 locales, word counts 40-60, equal faq count
- `bun run test`: 53 tests pass across 12 test files
- `bun run build`: clean build, no TypeScript errors

## Decisions Made

1. **No Reveal wrapper on leads** — plan explicitly forbids wrapping answer-first `<p>` in `<Reveal>` (Framer Motion sets `opacity:0` on first paint, hiding content from AI crawlers per Pitfall 3).
2. **server-only bypass in tests** — `getDictionary()` imports `"server-only"` which throws in vitest/jsdom. Tests import JSON files directly (`@/dictionaries/en.json`) — same data, avoids the guard, matches the codebase pattern used in `robots.test.ts`.
3. **Task 3 merged with Task 2** — both tasks modified `services/[slug]/page.tsx`; combining avoided a duplicate commit on the same file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FR waxing.lead was 65 words (exceeded 60-word ceiling)**
- **Found during:** Task 1 validation script
- **Issue:** First draft of FR waxing lead ran 65 words
- **Fix:** Trimmed to 57 words by removing prepositional phrases while preserving all required NAP/service details
- **Files modified:** src/dictionaries/fr.json
- **Commit:** 592168c (part of Task 1)

**2. [Rule 3 - Blocking] "server-only" guard prevents getDictionary() in vitest**
- **Found during:** Task 2 test writing
- **Issue:** `getDictionary` imports `"server-only"` which is not resolvable in vitest/jsdom environment
- **Fix:** Import JSON dictionary files directly instead of through getDictionary
- **Files modified:** src/app/[lang]/page.test.tsx, src/app/[lang]/faq/page.test.tsx
- **Commit:** f785820

## Known Stubs

None — all lead fields are wired to real dictionary strings; no placeholder text.

## Threat Flags

None — changes are read-only dictionary content and read-only JSON-LD emission. No new network endpoints, auth paths, or trust boundaries introduced.

## Self-Check: PASSED

- src/app/[lang]/page.test.tsx: FOUND
- src/app/[lang]/faq/page.test.tsx: FOUND
- Commit 592168c: verified in git log
- Commit f785820: verified in git log
- All 53 tests pass
- Build clean
