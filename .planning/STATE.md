---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: phase-plans-complete
stopped_at: Completed 04-04-PLAN.md (Wave 4 — final)
last_updated: "2026-06-22T16:42:00.000Z"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 4
  completed_plans: 4
  percent: 100
---

gsd_state_version: 1.0
milestone: v2.0
current_phase: 04
status: phase-plans-complete
last_updated: "2026-06-22"
total_phases: 3
completed_phases: 0
total_plans: 4
completed_plans: 4
percent: 100
current_phase_name: content-expansion
next: /gsd-verify-work 04 (all 4 plans executed — ready for verification)

## Decisions

- reviewGraph keeps a `lang` param for signature parity with productGraph/articleGraph (void lang) though the Review node is locale-agnostic today.
- The [PRICE:*] gate matcher is built via `new RegExp` from the fragment "PRICE" so the test file cannot self-match.
- Guides mirror comparisons: a new informational route = registry (guides.ts) + route + dict.guides block, only names/`/guides/` prefix change.
- Guide breadcrumb middle crumb uses serviceLabels.guides as the name and /services as the route (no /guides index route exists), mirroring the comparison route's middle crumb.
- All 3 guides map to service=manicure; price tokens left unfilled in all 4 locales (D-14 gate stays RED until the user fills real Sans Souci prices before merge).
- Sitemap content dates key on the EN slug and look up via path(x, "en"), not defaultLocale — defaultLocale is fr, so a defaultLocale lookup against EN-keyed PAGE_DATES silently fell back to FALLBACK_DATE (fixed in 04-04, commit a276591).

## Session

**Last session:** 2026-06-22T16:42:00.000Z
**Stopped at:** Completed 04-04-PLAN.md (Wave 4 — final). All 4 phase plans executed; ready for verification. Price gate (D-14) intentionally RED until user fills prices.
**Resume file:** .planning/phases/04-content-expansion/04-04-SUMMARY.md
