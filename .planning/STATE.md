---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 02 complete — all 3 plans done
last_updated: "2026-06-18T05:30:00.000Z"
last_activity: 2026-06-18 -- Phase 02-03 /llms.txt crawl surface complete
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 4
  completed_plans: 4
  percent: 75
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-17)

**Core value:** Every important page opens with a direct, factual, schema-backed answer that humans trust and AI engines can cite — and a visitor can book or contact within seconds.
**Current focus:** Phase 02 — content-schema-crawl-surface

## Current Position

Phase: 02 (content-schema-crawl-surface) — COMPLETE
Plan: 3 of 3 (all done)
Status: Phase 02 complete — all requirements SCHEMA-01/02/03, CONTENT-01/02/03, CRAWL-01/02 fulfilled
Last activity: 2026-06-18 -- Phase 02-03 /llms.txt + sitemap hygiene shipped

Progress: [████████░░] 75% (phase 2 complete; 4/4 plans done across phases 1-2)

## Performance Metrics

**Velocity:**

- Total plans completed: 1
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-prerequisites | 1 | ~25 min | ~25 min |
| 01 | 1 | - | - |

**Recent Trend:**

- Last 5 plans: 01-01 (~25 min, 4 tasks, 10 files, 38/38 tests), 02-01, 02-02, 02-03 (~15 min, 3 tasks, 7 files, 93/93 tests)
- Trend: on track — Phase 02 complete, all 8 requirements fulfilled

*Updated after each plan completion*

## Accumulated Context

### Decisions

- Roadmap (2026-06-17): Coarse granularity → 3 phases. Folded CRAWL-01 (llms.txt) into Phase 2 content+schema unit because llms.txt imports from the same NAP/service constants being built in that phase. CRAWL-02 (sitemap) also folded into Phase 2 — it extends the same routes.
- Roadmap (2026-06-17): MEAS-01 (GA4 custom channel) must be configured before Phase 2 content goes live. Phase 3 is ordered last so there is content to measure, but MEAS-01 setup must be the first task in Phase 3 — not after deployment.
- Roadmap (2026-06-17): Brownfield constraint confirmed — all work extends existing `seo.ts` builders, dictionaries, and the `[lang]` routing model. No new top-level directories.
- 02-02 (2026-06-17): Lead <p> NOT wrapped in <Reveal>/Framer Motion — opacity:0 hides from AI crawlers (Pitfall 3). Plain element before PageHeader.
- 02-02 (2026-06-17): /laval stays OUT of STANDALONE_PATHS — localized [lang] route, not standalone (D-05). Confirmed by proxy.ts grep.
- 02-02 (2026-06-17): dict.laval.faq.items is single source for both faqPageGraph schema and <Accordion> visible copy (SCHEMA-02 invariant).
- 02-02 (2026-06-17): localPaths array in sitemap.ts drives /laval locale entries — no hand-written per-locale blocks.
- 02-03 (2026-06-17): STANDALONE_PATHS merge-gate established — every non-[lang] route requires proxy.test.ts assertion before merge (mirrors /clientportal pattern).
- 02-03 (2026-06-17): sitemap lastModified uses static PAGE_DATES map (not live new Date()) — deterministic across builds (D-09).
- 02-03 (2026-06-17): x-default alternate points to /fr/<slug> (defaultLocale=fr) consistent with hreflang strategy.

### Pending Todos

None yet.

### Blockers/Concerns

- STANDALONE_PATHS coupling risk: every phase that adds a non-`[lang]` route (Phase 2 adds `llms.txt` route handler) requires a `src/proxy.test.ts` assertion before merge. Treat as a merge gate, not an afterthought.
- GA4 custom channel does not backfill. MEAS-01 must be configured before Phase 2 content ships to any live traffic. Sequence: configure GA4 channel → deploy Phase 2 content.
- hreflang reciprocity: Phase 2 FAQ hub and Laval local page must ship all 4 locale variants (en/fr/es/ar) simultaneously or emit no hreflang tags at all until complete.
- [RESOLVED 2026-06-17] Task 4 live crawler audit complete: all 8 AI UAs returned HTTP 200 from onglessanssouci.com/en; no CDN/WAF block detected; no infra escalation required (D-13 clear).

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Content Expansion | EXP-01: Comparison/decision pages (HowTo schema) | v2 | 2026-06-17 |
| Content Expansion | EXP-02: Cost guides, care guides, best-for pages | v2 | 2026-06-17 |
| Content Expansion | EXP-03: Markdown content routes for AI crawlers | v2 | 2026-06-17 |
| Advanced GEO | GEO-01: SpeakableSpecification for voice assistants | v2 | 2026-06-17 |
| Advanced GEO | GEO-02: Edge-middleware dark AI-referrer logging | v2 | 2026-06-17 |

## Session Continuity

Last session: 2026-06-18T05:30:00Z — Completed 02-03: /llms.txt + sitemap hygiene + SCHEMA-03 gate
Stopped at: Phase 02 complete — all 3 plans done; ready for Phase 03 (Measurement & Conversion)
Resume file: None — Phase 03 plan not yet created
