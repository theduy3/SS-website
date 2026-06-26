# Roadmap: Sans Souci Ongles & Spa

## Milestones

- ✅ **v1.0 — AI-Search (SEO + GEO)** — XSS-hardened JSON-LD, single-source NAP, AI-crawler access, answer-first content + FAQ hub (4 locales), per-route schema, `/llms.txt`, GA4 + Consent Mode v2, conversion events, trust signals, CWV RUM. *3 phases · 7 plans · shipped 2026-06-18.* → [`milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md)

---

# Milestone v2.0 — Content Expansion & Dark-Referrer Recovery

**Goal:** Scale the answer-first AI-citable surface (comparison + guide pages, `.md` twins for all content routes) and recover the dark AI-referred traffic GA4 misses. Schema is supporting, not the value driver (research: no schema↔citation correlation; HowTo/FAQ rich results deprecated). Phases continue v1 numbering.

### Phase 04: Content Expansion

**Depends on:** v1.0 (seo.ts builders, dictionaries, `[lang]` routing)
**Requirements:** EXP-01, EXP-02
**Why:** Highest citation leverage — more answer-first pages = more AI-citable surface. Reuses existing schema/i18n machinery; net-new is content + routes.
**Success criteria:**

1. ≥1 comparison page + ≥1 guide page render answer-first verdict/answer block in raw SSR HTML across en/fr/es/ar (`curl | grep`).
2. Comparison pages emit a scannable table + valid Product/Review/Breadcrumb JSON-LD (no HowTo).
3. No content hidden behind opacity:0 / Reveal (AI-crawler visibility invariant).

**Plans:** 4/4 plans complete
**Wave 1**

- [x] 04-01-PLAN.md — seo.ts schema builders (productGraph/reviewGraph/articleGraph) + null-safe JsonLd + [PRICE:*] build-fail gate

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — comparison set: retrofit 3 + add 3 category-alternatives, answer-first, Product/Review/Breadcrumb, KeyPageChrome, 4-locale copy

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03-PLAN.md — guide set: guides.ts registry + /guides/[slug] route + 3 guides (cost/care/best-for), Article/Breadcrumb, 4-locale copy

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 04-04-PLAN.md — wiring: sitemap (9 routes + x-default), llms.txt links, reciprocal service↔content links

**UI hint:** yes (new page templates).

### Phase 05: Agent-Readable Surface (`.md` twins)

**Depends on:** Phase 04 (new pages must also get `.md` twins)
**Requirements:** EXP-03
**Why:** Gives AI crawlers clean machine-readable text for every content route; extends the v1 `/llms.txt` + STANDALONE_PATHS pattern.
**Success criteria:**

1. Every `[lang]` content route (incl. Phase 04 pages) serves a force-static `.md` twin, HTTP 200 clean text.
2. `.md` routes pass through the proxy un-prefixed with a passing `proxy.test.ts` passthrough assertion (the load-bearing EXP-03 merge-gate invariant). Note: the proxy `matcher` already excludes all dotted paths, so `.md` routes bypass the proxy automatically — the test assertion is the gate; explicit `STANDALONE_PATHS` entries are skipped as dead config (planner reconciliation in 05-02-PLAN.md).
3. All `.md` routes linked from `/llms.txt` (EN-only index); `.md` content derives from same dictionary source as HTML (no drift).

**Plans:** 2/2 plans complete

- [x] 05-01-PLAN.md — Foundation: page-dates + md-routes + md-serializer (pure, tested) + smoke-tested home `[lang].md` handler
- [x] 05-02-PLAN.md — Fan-out 13 `.md` handlers + llms.txt EN index + proxy.test passthrough gate + md-coverage parity gate + build/curl verify

**UI hint:** no.

### Phase 06: Dark-Referrer Recovery

**Depends on:** v1.0 (AI-referrer host set); independent of 04/05
**Requirements:** GEO-02
**Why:** Recovers pre-consent AI sessions GA4's consent gate drops — measurement that informs future GEO content bets.
**Success criteria:**

1. Edge middleware logs AI-referred requests (host + path + timestamp, **no IP/PII/cookie**) to self-hosted Supabase.
2. Logging sits outside the Law25 consent gate (verified: no personal data) as aggregate analytics.
3. A query returns aggregate dark-referrer counts by host; row schema confirmed PII-free.

**Plans:** 2 plans
**Wave 1**

- [ ] 06-01-PLAN.md — DB migration (dark_referrals, RLS deny-by-default) + pure detection lib (AI_HOSTS, detectAiReferral, buildInsertPayload) + getDarkReferrerCounts read helper + unit tests incl. D-09 PII-allowlist gate

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 06-02-PLAN.md — Secret-guarded internal log route (service-role insert) + proxy.ts detection wiring (after() non-blocking POST) + proxy.test detection assertions

**UI hint:** no.

## Progress (v2.0)

| Phase | Plans Complete | Status |
|-------|----------------|--------|
| 04. Content Expansion | 0/? | Not started |
| 05. Agent-Readable Surface | 0/2 | Planned |
| 06. Dark-Referrer Recovery | 0/2 | Planned |
