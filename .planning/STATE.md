---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Phase 1 context gathered
last_updated: "2026-06-18T00:14:13.106Z"
last_activity: 2026-06-17 — Roadmap created; 15 v1 requirements mapped to 3 phases
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-17)

**Core value:** Every important page opens with a direct, factual, schema-backed answer that humans trust and AI engines can cite — and a visitor can book or contact within seconds.
**Current focus:** Phase 1 — Foundation Prerequisites

## Current Position

Phase: 1 of 3 (Foundation Prerequisites)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-06-17 — Roadmap created; 15 v1 requirements mapped to 3 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

- Roadmap (2026-06-17): Coarse granularity → 3 phases. Folded CRAWL-01 (llms.txt) into Phase 2 content+schema unit because llms.txt imports from the same NAP/service constants being built in that phase. CRAWL-02 (sitemap) also folded into Phase 2 — it extends the same routes.
- Roadmap (2026-06-17): MEAS-01 (GA4 custom channel) must be configured before Phase 2 content goes live. Phase 3 is ordered last so there is content to measure, but MEAS-01 setup must be the first task in Phase 3 — not after deployment.
- Roadmap (2026-06-17): Brownfield constraint confirmed — all work extends existing `seo.ts` builders, dictionaries, and the `[lang]` routing model. No new top-level directories.

### Pending Todos

None yet.

### Blockers/Concerns

- STANDALONE_PATHS coupling risk: every phase that adds a non-`[lang]` route (Phase 2 adds `llms.txt` route handler) requires a `src/proxy.test.ts` assertion before merge. Treat as a merge gate, not an afterthought.
- GA4 custom channel does not backfill. MEAS-01 must be configured before Phase 2 content ships to any live traffic. Sequence: configure GA4 channel → deploy Phase 2 content.
- hreflang reciprocity: Phase 2 FAQ hub and Montreal local page must ship all 4 locale variants (en/fr/es/ar) simultaneously or emit no hreflang tags at all until complete.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Content Expansion | EXP-01: Comparison/decision pages (HowTo schema) | v2 | 2026-06-17 |
| Content Expansion | EXP-02: Cost guides, care guides, best-for pages | v2 | 2026-06-17 |
| Content Expansion | EXP-03: Markdown content routes for AI crawlers | v2 | 2026-06-17 |
| Advanced GEO | GEO-01: SpeakableSpecification for voice assistants | v2 | 2026-06-17 |
| Advanced GEO | GEO-02: Edge-middleware dark AI-referrer logging | v2 | 2026-06-17 |

## Session Continuity

Last session: 2026-06-18T00:14:13.093Z
Stopped at: Phase 1 context gathered
Resume file: .planning/phases/01-foundation-prerequisites/01-CONTEXT.md
