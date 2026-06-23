# Phase 05: Agent-Readable Surface (`.md` twins) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-23
**Phase:** 05-Agent-Readable Surface (`.md` twins)
**Areas discussed:** Route coverage, Content shape, Frontmatter, llms.txt index

---

## Route coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Informational + legal | services + each service, faq, laval, about, comparisons ×6, guides ×3, terms, privacy; skip home/gallery/appointments/contact/reviews | |
| Informational only | services, each service, faq, laval, about, comparisons ×6, guides ×3 | |
| All content routes | Every `[lang]` route incl. home, gallery, contact, appointments, reviews | ✓ |

**User's choice:** All content routes
**Notes:** Literal reading of EXP-03. Thin/iframe pages (appointments, gallery) included; planner handles low-text mirror per D-04.

---

## Content shape

| Option | Description | Selected |
|--------|-------------|----------|
| Answer-first condensed | Lead with verdict/answer + key facts; strip chrome | |
| Full-page text mirror | Full page body → markdown, all sections, headings preserved | ✓ |

**User's choice:** Full-page text mirror
**Notes:** Raises the no-drift bar — flagged as key research item (component-composed bodies vs single dict source).

---

## Frontmatter

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — minimal frontmatter | title, lang, canonical HTML URL, last-updated | ✓ |
| No — plain body | H1 + content only | |

**User's choice:** Yes — minimal frontmatter

---

## llms.txt index

| Option | Description | Selected |
|--------|-------------|----------|
| EN-only links | List EN `.md` twins, keep existing "fr/es/ar variants exist" note | ✓ |
| All 4 locales | List every `.md` twin per locale | |

**User's choice:** EN-only links

---

## Claude's Discretion

- Proxy registration mechanism (enumerate paths vs `.md` suffix guard).
- Route factory shape (catch-all vs per-route factory; force-static).
- `.md` serializer design (dictionary-derived, no-drift) — key research item.

## Deferred Ideas

None — discussion stayed within phase scope.
