# Phase 2: Content, Schema & Crawl Surface - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 2-Content, Schema & Crawl Surface
**Areas discussed:** FAQ hub, Answer-first blocks, Laval local page, llms.txt, Answer-first scope, Laval shape, Copy authorship

---

## FAQ Knowledge Hub

| Option | Description | Selected |
|--------|-------------|----------|
| Expand existing /faq in place | Single /faq page → ~8-15 Q/As across 4 locales; schema auto-mirrors | ✓ |
| Categorized hub | Grouped sections (Visiting/Services/Booking/Policies) with anchors | |
| Hub + per-service FAQs | Expand /faq AND surface per-service FAQ schema on service pages | |

**User's choice:** Expand existing /faq in place
**Notes:** Per-service FAQPage is still required by ROADMAP success criterion 2 — handled as technical/Claude-discretion wiring, not via the hub restructure.

---

## Answer-First Blocks

| Option | Description | Selected |
|--------|-------------|----------|
| Key pages only, lead-paragraph | Home, services index, FAQ hub, Laval; styled lead paragraph | |
| Key pages + each service, callout box | Above + each /services/[slug]; distinct callout component | |
| All public pages, lead-paragraph | Every public route opens with an answer block | ✓ |

**User's choice:** All public pages, lead-paragraph (refined below to content pages only)
**Notes:** Refined in follow-up — see "Answer-First Scope".

---

## Laval Local Page

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /laval local page | New /[lang]/laval; neighborhood answer + CF Carrefour facts + local FAQ | ✓ |
| Fold Laval signals into home + FAQ | No new route; enrich home + FAQ with Laval content | |
| Dedicated page, English-anchored | New page, full EN, lighter fr/es/ar stubs | |

**User's choice:** Dedicated /laval local page
**Notes:** Shape refined in follow-up — see "Laval Shape".

---

## llms.txt Content

| Option | Description | Selected |
|--------|-------------|----------|
| Curated business brief + key links | Summary, NAP, services, hours, booking/contact, key-page links; EN canonical | ✓ |
| Brief + per-locale link index | Above + explicit 4-locale entry-point index | |
| Minimal pointer file | One-line description + sitemap/key-page links only | |

**User's choice:** Curated business brief + key links
**Notes:** Single canonical EN with note that fr/es/ar exist.

---

## Answer-First Scope (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Content pages only | Home, services index, each service, FAQ hub, Laval, about; skip legal/utility | ✓ |
| Truly all public routes | Every public page incl. privacy/terms/contact/gallery/reviews/comparisons | |
| Content pages + comparisons | Content pages plus /comparisons/[slug] | |

**User's choice:** Content pages only
**Notes:** Avoids ×4-locale translation cost on low-citation-value legal/utility pages.

---

## Laval Shape (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| /laval, answer-first + local FAQ | Single slug across locales; answer + facts + 3-5 local FAQ w/ FAQPage schema | ✓ |
| Localized slug, answer-first + local FAQ | Per-locale slug; same rich content | |
| /laval, answer-first only | Single slug, no separate FAQ block (folds into main hub) | |

**User's choice:** /laval, answer-first + local FAQ
**Notes:** Single `laval` slug across all 4 locales; carries its own 3-5 FAQ Q/As with FAQPage schema.

---

## Copy Authorship (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Claude drafts EN, you review, then translate | Claude writes EN from dict tone + NAP; user approves; fr/es/ar after | ✓ |
| Claude drafts all 4 locales upfront | One-pass en/fr/es/ar, reviewed together | |
| You supply copy, Claude wires | User provides text; Claude structures dict + schema + routes | |

**User's choice:** Claude drafts EN, you review, then translate
**Notes:** Schema reads same dict keys → verbatim match preserved through translation.

---

## Claude's Discretion

- Service-page `FAQPage` emission (wire `faqPageGraph` from existing per-service dict FAQ — roadmap-mandated)
- `AggregateRating` review-fetch gate (SCHEMA-03 — keep gated)
- Sitemap hygiene: `x-default`, accurate `lastModified`, add `/laval` (CRAWL-02 — approach is Claude's call)
- Per-route schema audit on home + services-index

## Deferred Ideas

- Categorized/sectioned FAQ hub → content-expansion milestone
- Answer-first on legal/utility + /comparisons → revisit if citation-worthy
- Per-locale Laval slug → revisit on local-SEO data
- Per-service standalone FAQ pages → only inline schema in scope
