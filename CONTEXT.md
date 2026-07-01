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

**Route factory** (`src/lib/md-route.ts`) — the deep module that owns the `.md`
twin handler: the resolve-or-404 handshake (locale guard → `bySlug`/404 →
`getDictionary` → canonical URL → `Response`) for every twin, plus
`generateStaticParams`. Three shapes: `homeMd`, `navMd`, `slugMd`. One interface,
one test surface (`md-route.test.ts`).

**Page resolver** (`src/lib/page-resolver.ts`) — the HTML twin of the route
factory. Owns the same resolve-or-404 handshake for the canonical HTML pages,
but returns *context* (`{ lang, entity, dict }` for slug pages, `{ lang, dict }`
for static) because an HTML page's body is bespoke JSX, not a pure `Response`.
`resolveSlugPage`/`resolveLangPage` throw `notFound()` on a miss; their metadata
twins (`slugPageMetadata`/`langPageMetadata`) return `{}` on a miss — the page/
metadata 404 asymmetry is deliberate and preserved. `slugStaticParams` folds the
locale-guarded `generateStaticParams`. A page can never resolve a slug its twin
would 404, because both cross the same seam.

**Total service lookup** (`serviceById` in `services.ts`) — resolves a
`ServiceId` relation to its `Service`, throwing loud on a miss instead of the
silent `services.find(...)!`. Lives in the relation's own lib, not the resolver.
