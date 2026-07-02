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

**Page-dates join** (`src/lib/page-dates.ts`) — the per-route last-modified
table, keyed by the route universe's `dateKey` (services share `/services`;
comparisons/guides use `xPath(entity, "en")`; static/nav use their path).
`pageDate(key)` throws loud on an unknown key — no silent fallback. The `.md`
serializer no longer resolves dates at all: the **md-route factory** owns the
`updated` frontmatter field, keying nav/home on the route path, slug families on
the entity's EN path (`SERVICE_DATE_KEY`, exported here from `route-universe`,
overrides that for services — they share one date). So `sitemap` (reads
`entry.dateKey`) and the factory derive from the same rule, and a twin's
`updated` can't drift from the sitemap's `lastModified` by construction, not by a
policed duplication. `page-dates.test.ts`
gates the table ⇔ route-universe parity in both directions (missing date and
orphan date), the same parity-gate idiom as `md-coverage` and `standalone-routes`.

**Widget catalog** (`src/lib/widgets.ts`) — the single home for every SalonX
embed's identity (script `src`, `store`, `storeAttr`, overlay `theme`,
`fallbackLabel`, `minHeight`). Pure data; pages render
`<WidgetEmbed {...widgets.<key>} />`, the only dynamic prop being `lang` (booking
is localized, supplied by the page). Replaced five one-caller wrapper components
(Checkin/Queue/ClientPortal/Subscribe/BookingWidget) that each held nothing but
these constants. `WidgetEmbed` stays the generic deep module (script injection,
loading/error/retry overlay, theme, height) — the one interface every page
crosses. The catalog is an adapter typed `satisfies Record<string, WidgetConfig>`
where `WidgetConfig = Omit<WidgetEmbedProps, "lang">`, so a renamed/removed prop
on `WidgetEmbed` is a compile error in the catalog — the interface is the test
surface. `widgets.test.ts` guards only what types can't: the non-default
`storeAttr` overrides (the historically-regressed class where a widget can't
locate its own script) and non-empty `src`/`fallbackLabel`.
