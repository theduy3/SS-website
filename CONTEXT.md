# Domain Glossary — SS-website

Ubiquitous language for the Sans Souci Ongles & Spa site. Names the seams so
architecture reviews and refactors speak the same terms.

## Content types

**Content type** — a family of localized, slug-addressed pages backed by a data
array + a dictionary slice. Three exist: **Service** (the money pages),
**Guide** (informational, answer-first), **Comparison** (decision pages, "X vs Y").
Each is keyed by a stable `id` (also the image filename / dictionary key) and a
per-locale `slug`.

## Seams

**Slug registry** — the deep module (`src/lib/slug-registry.ts`) that owns the
locale↔slug↔path mechanics for any content type: `slugParams`, `bySlug`, `path`,
`pathsByLocale`. Generic over the entity shape `{ id, slug: Record<Locale,string> }`.
One interface, one test surface. The three content-type libs call it once and
re-export named bindings.

- **Content data** and **slug mechanics** are now separate seams. The data
  (`services.ts` / `guides.ts` / `comparisons.ts` arrays + entity types) stays
  per-type; the mechanics live once in the slug registry. A new content type is
  data + one `slugRegistry(...)` call — not a fourth copy of the slug functions.
- **Service relation** (`*ForService`) is deliberately NOT in the registry — it's
  a relation between content types (a guide/comparison points at a service), not a
  slug concern, and only two of three types have it. It stays a one-line filter in
  its own lib.
