# ADR 0001 — Reject a shared content-tree AST for HTML pages and their .md twins

- Status: Accepted
- Date: 2026-06-30
- Context surfaced by: architecture review (candidate #5, "one content tree, two render adapters")

## Context

Each content type (service, guide, comparison) is rendered twice: as an HTML page
(`src/app/[lang]/<type>/[slug]/page.tsx`) and as a plain-markdown `.md` twin
(`renderXxxMd` in `src/lib/md-serializer.ts`). An architecture review proposed
collapsing the duplication by building a single **content tree** (a `Block[]` AST)
per page and rendering it through two thin adapters — one to JSX, one to markdown.

## Decision

**We do not build a shared content-tree AST.** The premise that the two renderers
walk the *same* tree does not hold:

- The `.md` twin is a **lossy subset** of the HTML page. The service page renders
  9 content areas (lead, intro, whyUs, included, addons, aftercare, hygiene, faq,
  related) plus HTML-only chrome (Reveal animations, hero image, SpecTable,
  KeyPageChrome, JsonLd — ~40 references). The twin renders only title, lead,
  included, addons, faq, price, related — in a different order, with different
  headings.
- A single tree would therefore carry the superset plus per-adapter
  include/skip/reorder rules. That is not "one tree, two thin adapters" — it is
  one tree plus two selection-heavy adapters, and it makes the hot HTML path more
  indirect.
- **Deletion test:** introducing the AST *moves* complexity (into a builder plus
  two adapters) rather than concentrating it, for only three content types. It
  fails the test.

The genuinely duplicated logic was narrow: both renderers independently derived
the **related comparison/guide links** (membership, order, title, path). That —
and only that — is extracted into `src/lib/related-links.ts` (`relatedLinks`),
consumed by both renderers. The rest is two presentations of the same dictionary
data, which is already the single source of truth.

## Consequences

- Content shape stays defined by the per-locale dictionary JSON; each renderer
  reads the fields it needs. Drift between page and twin is limited to field
  *selection*, caught by `md-coverage.test.ts` (path reachability) and review.
- Future architecture reviews should not re-propose a shared content-tree AST for
  the `.md` twins without new evidence that the twin has stopped being a lossy
  subset (e.g. it grows to full parity with the HTML page).
