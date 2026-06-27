---
phase: "02"
plan: "02"
subsystem: "content-schema"
tags: ["seo", "json-ld", "i18n", "answer-engine", "faq", "local-seo", "laval"]

# Dependency graph
requires:
  - phase: "02-01"
    provides: "answer-first lead pattern, faqPageGraph single-source pattern, dict expansion pattern"
provides:
  - "Laval local page at /[lang]/laval in all 4 locales (en/fr/es/ar)"
  - "dict.laval block: lead, heading, intro, faqHeading, facts (4), faq.items (5) in all 4 locales"
  - "FAQPage + BreadcrumbList JSON-LD on /laval route from single-source dict.laval.faq.items"
  - "Sitemap entries for /laval with reciprocal hreflang across all 4 locales"
affects: ["02-03"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "answer-first lead (plain <p>, no <Reveal>/Framer Motion — SSR-visible for AI crawlers)"
    - "FAQPage JSON-LD + Accordion from single dict source (SCHEMA-02)"
    - "localPaths array driving per-locale sitemap entries with alternates.languages"

key-files:
  created:
    - src/app/[lang]/laval/page.tsx
    - src/app/[lang]/laval/page.test.tsx
  modified:
    - src/dictionaries/en.json
    - src/dictionaries/fr.json
    - src/dictionaries/es.json
    - src/dictionaries/ar.json
    - src/app/sitemap.ts

key-decisions:
  - "Lead <p> NOT wrapped in <Reveal>/Framer Motion — opacity:0 hides from AI crawlers (Pitfall 3 / RESEARCH)"
  - "/laval stays OUT of STANDALONE_PATHS — it is a localized [lang] route, not standalone (D-05)"
  - "Single localPaths array in sitemap.ts drives /laval entries — no 4 hand-written blocks"
  - "dict.laval.faq.items is the single source for both faqPageGraph schema and <Accordion> visible copy (SCHEMA-02)"

patterns-established:
  - "Local page pattern: lead + PageHeader + facts dl + FAQ accordion + CTA — reusable for future local pages"
  - "localEntries sitemap block: add locale-agnostic paths to localPaths[] array for automatic 4-locale expansion"

requirements-completed: [CONTENT-03, SCHEMA-01, SCHEMA-02]

# Metrics
duration: ~20min
completed: 2026-06-17
---

# Phase 02 Plan 02: Laval Local Page Summary

**Dedicated /[lang]/laval local page with answer-first lead, CF Carrefour Laval facts, 5-item FAQ accordion, and FAQPage + BreadcrumbList JSON-LD emitted from single-source dict.laval.faq.items across all 4 locales with sitemap hreflang.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-17T21:53:00Z
- **Completed:** 2026-06-17T22:07:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Laval dictionary block (lead/heading/intro/faqHeading/facts/faq.items) authored in en/fr/es/ar with equal faq count (5), 40-60 word leads, and 4 location facts per locale
- `/[lang]/laval` page renders in all 4 locales with answer-first lead → PageHeader → facts dl → FAQ accordion (bg-fog) → CTA; lead is a plain `<p>` with no Framer Motion wrapper (SSR-visible)
- FAQPage + BreadcrumbList JSON-LD emitted in SSR HTML from single-source `dict.laval.faq.items`
- Sitemap extended with `localPaths = ["/laval"]` pattern — generates 4 locale entries with reciprocal `alternates.languages`
- 25 new tests pass (78/78 total); lint clean; build generates /en/laval /fr/laval /es/laval /ar/laval

## Task Commits

1. **Task 1: Laval dictionary block (all 4 locales) + RED test** - `ad562c3` (feat)
2. **Task 2: /[lang]/laval localized route** - `6e4ad2f` (feat)
3. **Task 3: /laval sitemap entry** - `24d6fc4` (feat)

## Files Created/Modified

- `src/app/[lang]/laval/page.tsx` — Laval local page: lead + facts dl + FAQ accordion + CTA + FAQPage/BreadcrumbList schema
- `src/app/[lang]/laval/page.test.tsx` — 25 SSR-layer tests: lead word count, facts shape, faqPageGraph, location signal assertions
- `src/dictionaries/en.json` — Added laval block (lead, heading, intro, faqHeading, 4 facts, 5 faq.items)
- `src/dictionaries/fr.json` — Translated laval block (equal structure, 5 faq.items)
- `src/dictionaries/es.json` — Translated laval block (equal structure, 5 faq.items)
- `src/dictionaries/ar.json` — Translated laval block in Arabic RTL (equal structure, 5 faq.items)
- `src/app/sitemap.ts` — localPaths array + localEntries block for /laval with reciprocal hreflang

## Decisions Made

1. **No Reveal wrapper on lead** — lead `<p>` is a plain element before PageHeader; Framer Motion's `opacity:0` initial state hides content from AI crawlers on first paint (RESEARCH Pitfall 3 / D-03). Matches the faq/page.tsx pattern from wave 01.
2. **localPaths in sitemap** — added a `localPaths` / `localEntries` pattern in `sitemap.ts` rather than adding `/laval` to `site.nav` or `site.secondaryNav` (it's a local-citation page, not navigation). Single source, no duplicate blocks.
3. **Single-source faq.items** — `dict.laval.faq.items` is passed to both `faqPageGraph()` and `<Accordion>` with no copying — guarantees schema/copy parity (SCHEMA-02).

## Deviations from Plan

None — plan executed exactly as written. All three tasks followed the documented patterns from wave 01 and the UI-SPEC.

## Known Stubs

None — all content is wired to real dictionary strings. No placeholder text or hardcoded empty values.

## Threat Flags

None — no new network endpoints or auth paths introduced. The /laval route is a localized read-only SSG page using the existing [lang] routing. JSON-LD flows through the existing `<JsonLd>` component which escapes `<` (T-02-04 mitigated). /laval is confirmed absent from STANDALONE_PATHS (T-02-05 mitigated).

## Self-Check: PASSED

- src/app/[lang]/laval/page.tsx: FOUND
- src/app/[lang]/laval/page.test.tsx: FOUND
- Commit ad562c3: dict block + tests
- Commit 6e4ad2f: laval page
- Commit 24d6fc4: sitemap entry
- 78/78 tests pass
- Build clean: /en/laval /fr/laval /es/laval /ar/laval generated
- lint: clean (0 errors)

---
*Phase: 02-content-schema-crawl-surface*
*Completed: 2026-06-17*
