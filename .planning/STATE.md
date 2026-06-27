---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: complete
stopped_at: Phase 06 Plan 02 complete — GEO-02 fully wired end-to-end
last_updated: "2026-06-26T11:45:00.000Z"
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
  percent: 100
---

gsd_state_version: 1.0
milestone: v2.0
current_phase: 04
status: Executing Phase 6
last_updated: "2026-06-22"
total_phases: 3
completed_phases: 0
total_plans: 4
completed_plans: 4
percent: 100
current_phase_name: content-expansion
next: /gsd-verify-work 04 (all 4 plans executed — ready for verification)

## Decisions

- vi.hoisted(() => vi.fn()) required for Vitest 4.x mock factory variable access — plain const puts variable in TDZ when vi.mock is hoisted above it.
- DARK_REFERRAL_ORIGIN env var override resolves RESEARCH Open Question 1 (loopback vs public URL in Dokploy container) — default uses request.nextUrl.origin.
- detectAiReferral placed as FIRST statement in proxy() before any early return — R-01 invariant (Referer only present on first bare-path request before locale 301).
- reviewGraph keeps a `lang` param for signature parity with productGraph/articleGraph (void lang) though the Review node is locale-agnostic today.
- The [PRICE:*] gate matcher is built via `new RegExp` from the fragment "PRICE" so the test file cannot self-match.
- Guides mirror comparisons: a new informational route = registry (guides.ts) + route + dict.guides block, only names/`/guides/` prefix change.
- Guide breadcrumb middle crumb uses serviceLabels.guides as the name and /services as the route (no /guides index route exists), mirroring the comparison route's middle crumb.
- All 3 guides map to service=manicure; price tokens left unfilled in all 4 locales (D-14 gate stays RED until the user fills real Sans Souci prices before merge).
- Sitemap content dates key on the EN slug and look up via path(x, "en"), not defaultLocale — defaultLocale is fr, so a defaultLocale lookup against EN-keyed PAGE_DATES silently fell back to FALLBACK_DATE (fixed in 04-04, commit a276591).

## Session

**Last session:** 2026-06-26T11:42:06.479Z
**Stopped at:** Phase 06 Plan 02 complete — proxy wiring + log route (GEO-02 end-to-end)
**Resume file:** .planning/phases/06-dark-referrer-recovery/06-02-SUMMARY.md

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 06-dark-referrer-recovery P01 | 11m | 2 tasks | 4 files |
| Phase 06-dark-referrer-recovery P02 | 20m | 2 tasks | 4 files |
