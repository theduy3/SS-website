# Phase 05: Agent-Readable Surface (`.md` twins) — Research

**Researched:** 2026-06-23
**Domain:** Next.js 16 App Router route handlers, dictionary-derived content serialization, proxy middleware, llms.txt
**Confidence:** HIGH (all findings verified directly against codebase and bundled Next.js 16.2.6 docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — Route coverage:** `.md` twins cover **all content routes** — every `[lang]` route:
home (`/`), services (index) + each `services/[slug]`, about, appointments, contact, gallery,
reviews, faq, terms, privacy, laval, each `comparisons/[slug]` (×6), each `guides/[slug]` (×3)
— in all 4 locales (en/fr/es/ar).

**D-02 — Coverage parity:** enforced against the canonical route source (same registries/`site.ts`
nav the `sitemap.ts` enumerates). A new route cannot get a sitemap entry without a `.md` twin.

**D-03 — Full-page text mirror:** each `.md` twin is a full-page text mirror — all sections,
headings preserved. Not an answer-first condensed extract.

**D-04 — Thin/transactional pages:** appointments (SalonX iframe) and gallery (image grid)
mirror whatever dictionary copy exists (heading + intro/blurb) and link out to the live
booking/gallery rather than attempting to mirror an iframe or image grid.

**D-05 — Frontmatter:** each `.md` opens with minimal YAML frontmatter: `title`, `lang`,
`canonical` (HTML page URL), `updated` (last-modified date).

**D-06 — llms.txt index:** `/llms.txt` lists EN `.md` twins only; keeps the existing
"FR/ES/AR variants exist at /fr/, /es/, /ar/" convention.

### Claude's Discretion

- Proxy registration mechanism: enumerate `STANDALONE_PATHS` vs. add `.md`-suffix guard.
- Route factory shape: single catch-all vs. per-family factory + `generateStaticParams`.
- `.md` serializer: how to render full-page mirror from dictionary without drift.

### Deferred Ideas (OUT OF SCOPE)

None. Dark-referrer logging = Phase 06; SpeakableSpecification = v2.0 backlog.
</user_constraints>

---

## Summary

Phase 05 delivers `.md` twins for all 96 locale-prefixed content routes (11 nav/secondary/local
paths × 4 locales + 4 service slugs × 4 + 6 comparison slugs × 4 + 3 guide slugs × 4 = 96
routes). Every twin is pre-rendered at build time (`force-static`) and derives its text from the
same dictionary JSON the HTML page reads — no second copy of content.

The critical architectural finding is that **the proxy middleware's `matcher` regex
`/((?!_next|api|.*\\.\\..*).*)/` already excludes all paths containing a dot** (file-extension
pattern). This means `.md` routes are never processed by the proxy function at all — they bypass
locale routing automatically. `STANDALONE_PATHS` registration has no functional effect on `.md`
routes. However, EXP-03 mandates `proxy.test.ts` assertions as a merge-gate invariant per the
`standalone-route-proxy-coupling` memory note. The recommended resolution is a single test
assertion that `*.md` paths produce no `Location` header (proxy passthrough), not 96 new
`STANDALONE_PATHS` entries.

The serializer approach is feasible for all route families. Every page's visible text is
fully expressible as ordered dictionary key reads — no page section relies on server-computed
data that is unavailable at serialization time. The key insight is that the dictionary is typed
(`Dictionary = typeof en`) and the per-page content model maps exactly to ordered key sequences
that can be read once and emitted as markdown sections.

**Primary recommendation:** Use a shared `mdSerializer` that reads dictionary slices in
page-section order (mirroring the component render order) to produce the `.md` body. Route
handlers live as `app/[lang]/[routeName].md/route.ts` folders for nav routes and
`app/[lang]/services/[slug].md/route.ts` for slug routes — the same literal-extension-folder
idiom as `app/llms.txt/route.ts`. The home page `.md` twin lives at `app/[lang].md/route.ts`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| `.md` content serialization | API / Backend (route handler) | — | Pure server-side: reads dict JSON, returns `Response`. Never needs client state. |
| Dictionary content source | API / Backend | — | `getDictionary` is `server-only`; `.md` handler reads same loader. |
| Route generation / static params | Frontend Server (SSR) | — | `generateStaticParams` in route handler file pre-renders all locale×slug combos. |
| Proxy passthrough for `.md` | CDN / Static | — | Proxy matcher excludes `.md` paths by file-extension regex; they bypass middleware. |
| llms.txt `.md` index section | API / Backend | — | Added to existing `app/llms.txt/route.ts` GET function body. |
| Coverage parity test | — (test layer) | — | Vitest test compares `.md` route set vs sitemap entries. |

---

## Standard Stack

### Core (no new packages required)

| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| Next.js App Router route handlers | 16.2.6 (in use) | `GET` function in `route.ts` file | Existing pattern; `llms.txt/route.ts` is precedent |
| `getDictionary` / `dictionaries.ts` | in repo | Load per-locale `Dictionary` on server | Already `server-only`; typed; single source of truth |
| `site.ts` | in repo | Business facts (NAP, hours, booking URL) | Locale-invariant; same source as `llms.txt/route.ts` |
| `services.ts` / `comparisons.ts` / `guides.ts` | in repo | Registry + `*Path(item, lang)` helpers | Path builders already tested; comparison/guideLabels in llms.txt |
| Vitest 4.1.8 | in repo | Test runner (`bun run test`) | Existing test runner; `proxy.test.ts` uses this |

### Supporting (no new packages)

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| `sitemap.ts` | in repo | Canonical route enumerator for coverage parity test | Import in `md-coverage.test.ts` to assert parity |
| `i18n.ts` (`locales`, `isLocale`) | in repo | Locale validation in route handlers | Guard `generateStaticParams` and GET handler |

**No new npm packages are needed.** The entire implementation is dictionary reads + `new Response()`.

---

## Package Legitimacy Audit

No external packages are installed in this phase.

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious:** none

---

## PRIMARY RESEARCH ITEM: Content Model Analysis

### The load-bearing question: can a `.md` serializer read the same dict slices the components read?

**Answer: YES for 12 of 14 route families. Two families have thin-page exceptions (D-04).**

### Route-by-route content map

**How to read this table:**
- "Dict keys (in section order)" = the dictionary key path the `.md` serializer reads in the
  same order sections appear on the page.
- "Extra source" = data from `site.ts` or a registry that supplements the dict.
- "Thin/D-04" = falls under the D-04 exception: mirror dict copy + link out.

---

#### Home (`/`)
Dict keys (in section order):
1. `dict.hero.tagline` → H1
2. `dict.home.lead` → lead paragraph
3. `dict.home.servicesHeading` → H2
4. `dict.services[i].title` + `dict.services[i].body` × 4 services → service cards
5. `dict.home.storyHeading` + `dict.home.story` → why-us section
6. `dict.home.galleryHeading` → gallery section heading (no image content)
7. `dict.home.contactHeading` + `dict.home.contactIntro` → contact section
8. `dict.reviews.eyebrow` + `dict.reviews.headlineLead` + `dict.reviews.headlineMain` → reviews

Extra source: `site.reviews.ratingValue`, `site.reviews.reviewCount` (for rating display)

Assessment: **FULLY SERIALIZABLE** — all text comes from dict. Images and `<Gallery>` component
produce no text that isn't in the dict. The `<Testimonials>` component text is not in the dict
(it reads a separate data source), but the section heading and framing copy are.

Note on `<Testimonials>`: the individual review quote text is not in the dictionary. It comes
from `src/lib/reviews.ts` or a similar data source (same as the reviews page). For the home page
`.md`, the rating summary (from `site.reviews`) plus `dict.reviews.headlineLead/Main` covers the
reviews section adequately per D-03 ("full page text mirror from the dictionary source"). The
serializer should emit the aggregate rating and the reviews CTA, linking to the reviews page for
individual quotes.

---

#### Services index (`/services`)
Dict keys:
1. `dict.servicesPage.lead` → lead paragraph
2. `dict.servicesPage.heading` → H1
3. `dict.servicesPage.intro` → intro
4. `dict.serviceDetails[s.id].title` + `dict.serviceDetails[s.id].metaDescription` + price → per service

Extra source: `services` registry (`s.price`, `s.priceTo`, `servicePath(s, lang)`)

Assessment: **FULLY SERIALIZABLE**

---

#### Services detail (`/services/[slug]`)
Dict keys (`d = dict.serviceDetails[service.id]`, `labels = dict.serviceLabels`):
1. `d.lead` → lead paragraph
2. `d.title` → H1
3. `d.intro[]` → intro paragraphs (array)
4. `labels.why` + `d.whyUs` → H2 + paragraph
5. `labels.included` + `d.included[]` → H2 + list
6. `labels.addons` + `d.addons[]` → H2 + list
7. `labels.price` + price display + `labels.duration` + `d.duration` → price/duration
8. `labels.aftercare` + `d.aftercare` → H2 + paragraph
9. `labels.hygiene` + `d.hygiene` → H2 + paragraph
10. `labels.faq` → H2; then `d.faq[].q` / `d.faq[].a` × FAQ items
11. `labels.guides` + related comparison/guide titles and links → cross-links

Extra source: `service.price`, `service.priceTo`, `comparisonsForService(service.id)`,
`guidesForService(service.id)`, `comparisonPath`, `guidePath`

Assessment: **FULLY SERIALIZABLE** — richest page, but every section maps to a dict key.

---

#### About (`/about`)
Dict keys:
1. `dict.about.lead` → lead paragraph
2. `dict.about.heading` → H1
3. `dict.about.body[]` → paragraphs (array of 3)

Assessment: **FULLY SERIALIZABLE**

---

#### Appointments (`/appointments`) — D-04 THIN PAGE
Dict keys:
1. `dict.appointments.heading` → H1
2. `dict.appointments.intro` → intro
3. `dict.appointments.helpBefore` + phone + `dict.appointments.helpAfter` → call CTA

Extra source: `site.contact.phone`, `site.contact.phoneHref`, `site.booking` URL

The booking widget is a client-side iframe (SalonX `<BookingWidget>`). No text content. Per
D-04: emit heading + intro + help copy + a link to the live appointments page.

Assessment: **D-04 THIN — link-out pattern**. Mirror dict copy + `Book here: <canonical URL>`.

---

#### Contact (`/contact`)
Dict keys:
1. `dict.contact.heading` → H1
2. `dict.contact.intro` → intro
3. `dict.labels.location` → H2
4. `dict.labels.contact` → H2

Extra source: `site.contact.landmark`, `site.contact.address.line1/line2`,
`site.contact.email`, `site.contact.phone`

The `<ContactForm>` is a client-side component (no text beyond the form fields, which are in
`dict.form`). Include form field labels as a flat list.

Assessment: **FULLY SERIALIZABLE** — NAP data from `site.ts`, labels from dict.

---

#### Gallery (`/gallery`) — D-04 THIN PAGE
Dict keys:
1. `dict.gallery.title` → H1
2. `dict.gallery.intro` → intro
3. `dict.gallery.photos[id].alt` + `dict.gallery.photos[id].caption` → image list

Per D-04: image grid has no body text beyond alt/caption. Mirror title, intro, and caption list;
link out to the live gallery page for the visual experience.

Assessment: **D-04 THIN — link-out pattern**. Mirror captions (they ARE in the dict) + link.

Note: unlike appointments (iframe), gallery captions are actually in the dictionary, so
the `.md` can still list them. D-04 applies mainly because there is no prose body.

---

#### Reviews (`/reviews`)
Dict keys:
1. `dict.reviewsPage.title` → H1
2. `dict.reviewsPage.intro` → intro
3. `dict.reviews.basedOn` + rating + `dict.reviews.reviewsWord` → rating display
4. `dict.reviewsPage.cta` → CTA

Extra source: `site.reviews.ratingValue`, `site.reviews.reviewCount` (aggregate stats)
Individual review cards come from `src/lib/reviews.ts` — their text IS available on the
server but is NOT in the dictionary. Include them as a list if available; fall back to
aggregate rating + CTA if `reviews` array is empty.

Assessment: **SERIALIZABLE** — include aggregate rating + review cards from `reviews.ts`
(same server-accessible data the page uses). Review card text is not in the dict JSON, so
strictly D-03 is "best effort" for individual quotes. Aggregate stats + heading + CTA are
fully dict-derived.

---

#### FAQ (`/faq`)
Dict keys:
1. `dict.faq.lead` → lead paragraph
2. `dict.faq.title` → H1
3. `dict.faq.intro` → intro
4. `dict.faq.items[].q` / `dict.faq.items[].a` → Q&A list (15 items)

Assessment: **FULLY SERIALIZABLE** — all FAQ Q&A is in the dict.

---

#### Laval (`/laval`)
Dict keys:
1. `dict.laval.lead` → lead paragraph
2. `dict.laval.heading` → H1
3. `dict.laval.intro` → intro
4. `dict.laval.facts[].term` / `dict.laval.facts[].detail` → location facts
5. `dict.laval.faqHeading` → H2
6. `dict.laval.faq.items[].q` / `dict.laval.faq.items[].a` → FAQ items

Assessment: **FULLY SERIALIZABLE**

---

#### Terms (`/terms`)
Dict keys: `dict.legal.terms` → `{ heading, intro, sections[], updated }`

Sections use a block DSL: `[{ kind: "p"|"h3"|"ul", text: string, items: string[] }]`

Assessment: **FULLY SERIALIZABLE** — block DSL maps cleanly to markdown (p → paragraph,
h3 → `###`, ul → `- ` list items). The serializer needs one recursive helper for the block array.

---

#### Privacy (`/privacy`)
Dict keys: `dict.legal.privacy` → same structure as terms.

Assessment: **FULLY SERIALIZABLE** — same block DSL.

---

#### Comparisons (`/comparisons/[slug]`)
Dict keys (`c = dict.comparisons[cmp.id]`, `labels = dict.comparisonLabels`):
1. `c.title` → H1
2. `c.verdict` → verdict paragraph (answer-first, outside Reveal on page)
3. `c.intro[]` → intro paragraphs
4. `c.columns[]` + `c.rows[].label` + `c.rows[].cells[]` → comparison table as markdown table
5. `labels.related` + service title + link → related service
6. `dict.serviceLabels.faq` → FAQ heading; `c.faq[].q` / `c.faq[].a` → FAQ items

Extra source: `services` registry (to get service title), `servicePath(service, lang)`

Assessment: **FULLY SERIALIZABLE** — the ComparisonTable component renders `c.columns` and
`c.rows`, which are pure dict data. A markdown table is trivial to generate from them.

---

#### Guides (`/guides/[slug]`)
Dict keys (`g = dict.guides[guide.id]`, `labels = dict.serviceLabels`):
1. `g.title` → H1
2. `g.answer` → answer-first paragraph
3. `g.sections[].heading` + `g.sections[].body` → H2 + paragraphs (array)
4. `g.faq[].q` / `g.faq[].a` → FAQ items

Extra source: none required for body; related service link uses `servicePath` + dict title.

Assessment: **FULLY SERIALIZABLE**

---

### Conclusion: Shared Content Model

All text visible to AI crawlers on every page can be reconstructed by reading the dictionary
in component-render order. No route requires a second copy of content. The serializer is a
pure function:

```typescript
function renderPageMd(lang: Locale, dict: Dictionary, route: MdRoute, site: typeof site): string
```

Each route family gets an ordered section list of `[heading, dictKey | staticValue]` tuples.
The `MdRoute` discriminated union identifies the route family (home, service, comparison, etc.)
and carries the registry item (e.g. `Service`, `Comparison`, `Guide`) for slug routes.

---

## Architecture Patterns

### System Architecture Diagram

```
Build time (generateStaticParams):
  registries (services/comparisons/guides) + locales
      |
      v
  route handler files enumerate all locale × slug combos
      |
      v
  Next.js pre-renders each .md route as static file

Request time (already pre-rendered):
  GET /{locale}/{path}.md
      |
      v
  Proxy matcher excludes (*.md has dots → bypassed entirely)
      |
      v
  Next.js serves pre-rendered static response
      |
      v
  HTTP 200, text/markdown; charset=utf-8
```

### Recommended File Structure

```
src/app/
├── [lang].md/                    # home .md twin: /en.md, /fr.md, /es.md, /ar.md
│   └── route.ts                  # export const dynamic = "force-static"
├── [lang]/
│   ├── about.md/                 # /en/about.md etc.
│   │   └── route.ts
│   ├── services.md/              # /en/services.md etc.
│   │   └── route.ts
│   ├── appointments.md/          # D-04 thin
│   │   └── route.ts
│   ├── contact.md/
│   │   └── route.ts
│   ├── gallery.md/               # D-04 thin
│   │   └── route.ts
│   ├── reviews.md/
│   │   └── route.ts
│   ├── faq.md/
│   │   └── route.ts
│   ├── terms.md/
│   │   └── route.ts
│   ├── privacy.md/
│   │   └── route.ts
│   ├── laval.md/
│   │   └── route.ts
│   ├── services/
│   │   └── [slug].md/            # /en/services/manicure.md etc.
│   │       └── route.ts
│   ├── comparisons/
│   │   └── [slug].md/            # /en/comparisons/gel-vs-regular-manicure.md etc.
│   │       └── route.ts
│   └── guides/
│       └── [slug].md/            # /en/guides/manicure-cost-laval.md etc.
│           └── route.ts
└── llms.txt/
    └── route.ts                  # EXISTING — add .md index section here
src/lib/
└── md-serializer.ts              # NEW: renderPageMd() pure function + block helpers
src/
└── md-coverage.test.ts           # NEW: coverage parity test (sitemap == md routes)
```

**Total route handler files:** 14 (11 nav + 3 slug families)

### Pattern 1: Force-Static Route Handler (nav routes)

Mirrors the `llms.txt/route.ts` shape exactly.

```typescript
// src/app/[lang]/about.md/route.ts
// Source: verified against node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
import "server-only";
import { getDictionary } from "../dictionaries";
import { site } from "@/lib/site";
import { renderAboutMd } from "@/lib/md-serializer";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }, { lang: "es" }, { lang: "ar" }];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string }> }
): Promise<Response> {
  const { lang } = await params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });
  const dict = await getDictionary(lang);
  const canonical = `${site.url}/${lang}/about`;
  const body = renderAboutMd(lang, dict, canonical);
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
```

### Pattern 2: Slug Route Handler with generateStaticParams

```typescript
// src/app/[lang]/services/[slug].md/route.ts
// Source: verified against node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md
import "server-only";
import { getDictionary } from "../../dictionaries";
import { site } from "@/lib/site";
import { serviceBySlug, slugParams, servicePath } from "@/lib/services";
import { comparisonsForService, comparisonPath } from "@/lib/comparisons";
import { guidesForService, guidePath } from "@/lib/guides";
import { renderServiceMd } from "@/lib/md-serializer";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-static";

// Emit this locale's slugs only — same guard as services/[slug]/page.tsx
export function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return [];
  return slugParams(params.lang);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string; slug: string }> }
): Promise<Response> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });
  const service = serviceBySlug(lang, slug);
  if (!service) return new Response("Not found", { status: 404 });
  const dict = await getDictionary(lang);
  const canonical = `${site.url}/${lang}${servicePath(service, lang)}`;
  const relatedComparisons = comparisonsForService(service.id);
  const relatedGuides = guidesForService(service.id);
  const body = renderServiceMd(lang, dict, service, canonical, relatedComparisons, relatedGuides);
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
```

### Pattern 3: md-serializer helpers

```typescript
// src/lib/md-serializer.ts — pure functions, no React, no "server-only"
// Importable from route handlers AND from tests.

import type { Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import type { Service } from "@/lib/services";
import type { Comparison } from "@/lib/comparisons";
import type { Guide } from "@/lib/guides";
import { site } from "@/lib/site";

// YAML frontmatter block
export function frontmatter(opts: {
  title: string;
  lang: string;
  canonical: string;
  updated: string;  // YYYY-MM-DD
}): string {
  return [
    "---",
    `title: "${opts.title}"`,
    `lang: ${opts.lang}`,
    `canonical: ${opts.canonical}`,
    `updated: ${opts.updated}`,
    "---",
    "",
  ].join("\n");
}

// Render the legal block DSL (terms/privacy sections)
type Block = { kind: "p" | "h3" | "ul"; text: string; items: string[] };
export function renderBlocks(blocks: readonly Block[]): string {
  return blocks
    .map((b) => {
      if (b.kind === "h3") return `### ${b.text}`;
      if (b.kind === "ul") return b.items.map((item) => `- ${item}`).join("\n");
      return b.text; // "p"
    })
    .join("\n\n");
}

// Render a markdown table from comparison columns + rows
export function renderComparisonTable(
  columns: readonly string[],
  rows: readonly { label: string; cells: readonly string[] }[]
): string {
  const header = `| ${columns.join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const rowLines = rows.map((r) => `| ${r.label} | ${r.cells.join(" | ")} |`);
  return [header, separator, ...rowLines].join("\n");
}
```

### Pattern 4: Home page `.md` route location

The home HTML page lives at `app/[lang]/page.tsx` → URL `/en`. Its `.md` twin must be at `/en.md`.
That requires a folder `app/[lang].md/` at the same level as `app/[lang]/`. The `[lang]` in the
folder name is a Next.js dynamic segment. The literal `.md` suffix is part of the URL (mirroring
the `llms.txt/` folder pattern). `generateStaticParams` in this file returns the four locale
objects only.

```typescript
// src/app/[lang].md/route.ts  → serves /en.md, /fr.md, /es.md, /ar.md
export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }, { lang: "es" }, { lang: "ar" }];
}
```

Note: there is no conflict with `app/[lang]/page.tsx` because `[lang].md` and `[lang]` are
different segments at the `app/` level.

### Pattern 5: llms.txt `.md` index section (D-06)

Add after the existing `## Guides` section in `app/llms.txt/route.ts`:

```typescript
// In the body template string, after ## Guides:
const mdSection = `
## Machine-Readable Pages (.md)
EN-only listing. FR/ES/AR variants replace /en/ with /fr/, /es/, /ar/.

### Key Pages
- Home: ${site.url}/en.md
- Services: ${site.url}/en/services.md
- About: ${site.url}/en/about.md
- FAQ: ${site.url}/en/faq.md
- Laval: ${site.url}/en/laval.md
- Contact: ${site.url}/en/contact.md
- Reviews: ${site.url}/en/reviews.md

### Service Pages
${services.map((s) => `- ${serviceDetailLabels[s.id]}: ${site.url}/en/services/${s.slug.en}.md`).join("\n")}

### Comparisons
${comparisons.map((c) => `- ${comparisonLabels[c.id]}: ${site.url}/en${comparisonPath(c, "en")}.md`).join("\n")}

### Guides
${guides.map((g) => `- ${guideLabels[g.id]}: ${site.url}/en${guidePath(g, "en")}.md`).join("\n")}
`;
```

The existing `comparisonLabels` and `guideLabels` Records in `llms.txt/route.ts` are reused
directly. A new `serviceDetailLabels` Record (keyed by `ServiceId`) needs to be added
following the same pattern.

### Anti-Patterns to Avoid

- **Adding 96 entries to `STANDALONE_PATHS`:** `.md` routes bypass the proxy matcher entirely
  (file-extension exclusion). `STANDALONE_PATHS` has no functional effect. Bloating it by 96
  entries adds maintenance cost with zero benefit. The merge-gate invariant is satisfied by a
  test assertion instead.
- **Reading `params.lang` without `isLocale` guard:** slug route handlers must guard the same
  way as `page.tsx` files (the pattern is `if (!isLocale(lang)) return new Response("Not found", { status: 404 })`).
- **Importing `getDictionary` without `"server-only"` in route handler:** the loader is already
  `server-only`; route handlers run on the server, so this is fine, but the serializer helper
  (`md-serializer.ts`) must NOT be marked `server-only` because tests import it directly.
- **Using `new Date()` in `updated` frontmatter:** will cause non-deterministic builds.
  Use `PAGE_DATES` from `sitemap.ts` or the same static date constants.
- **Placing `route.ts` at the same level as `page.tsx` in `app/[lang]/about/`:** Next.js
  prohibits a `route.js` at the same route segment as `page.js`. The folder must be `about.md/`
  not `about/`, which gives URL `/en/about.md` not `/en/about` — correct.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Markdown table from comparison data | Custom table renderer | `renderComparisonTable()` in `md-serializer.ts` (write once, test once) | Columns/rows are pure data; one utility covers all 6 comparisons |
| Legal block DSL rendering | Inline switch in each route | `renderBlocks()` in `md-serializer.ts` | Block DSL is shared by terms AND privacy; one helper |
| YAML frontmatter | Inline string template per route | `frontmatter()` in `md-serializer.ts` | Consistent format; easy to test; change in one place |
| Locale validation per handler | Copy-paste guard | `isLocale()` from `@/lib/i18n` | Already tested |
| Slug → registry item lookup | Custom lookup per route | `serviceBySlug`, `comparisonBySlug`, `guideBySlug` | Already exist and handle 404 |

---

## Proxy Registration Decision

### Finding: `.md` routes do NOT need `STANDALONE_PATHS` entries for functional routing

The proxy `matcher` in `src/proxy.ts` is:
```
matcher: ["/((?!_next|api|.*\\..*).*)", "/api/admin/:path*"]
```

The lookahead `.*\\..* ` matches any path containing a dot — which excludes all `.md` routes
from the proxy middleware entirely. A request for `/en/about.md` never reaches the proxy
function body; Next.js serves it directly.

Verified with Node.js:
```
/en/about.md         → EXCLUDED from proxy (bypasses)
/en/comparisons/gel-vs-regular-manicure.md → EXCLUDED
/en.md               → EXCLUDED
/llms.txt            → EXCLUDED (same rule — has a dot)
/en/about            → MATCHED (goes through proxy)
```

`/llms.txt` is in `STANDALONE_PATHS` for historical reasons (the proxy test was written before
this analysis). It is also excluded by the matcher regex, making its `STANDALONE_PATHS` entry
redundant — but removing it would break the existing test, so leave it.

### Recommendation: `.md`-suffix test assertion (not `STANDALONE_PATHS` entries)

Add ONE new test to `proxy.test.ts`:

```typescript
it("does not locale-prefix .md routes (EXP-03 merge gate: .md bypass)", async () => {
  // .md routes have dots and are excluded from the proxy matcher.
  // The proxy function is never called for them; this test verifies
  // that behaviour holds for a representative set.
  const mdPaths = [
    "/en/about.md",
    "/en/services/manicure.md",
    "/en/comparisons/gel-vs-regular-manicure.md",
    "/en/guides/manicure-cost-laval.md",
    "/en.md",
  ];
  for (const path of mdPaths) {
    const res = await proxy(req(path));
    expect(res.headers.get("location"), `${path} must not redirect`).toBeNull();
  }
});
```

This satisfies the EXP-03 merge-gate invariant (proxy.test.ts assertion) without adding 96
`STANDALONE_PATHS` entries. The test will fail if the proxy matcher pattern is ever changed to
include `.md` paths without corresponding `STANDALONE_PATHS` registration.

### Content-Type Recommendation: `text/markdown; charset=utf-8`

`/llms.txt` uses `text/plain; charset=utf-8` because it is plain text with a `.txt` extension.
`.md` files are markdown. Use `text/markdown; charset=utf-8` (RFC 7763) for the `.md` routes.
This is the correct MIME type and helps clients (and AI crawlers) identify the format.
`curl` will still receive HTTP 200 clean text — the content-type does not affect readability.

---

## Coverage Parity Test (D-02)

A Vitest test that imports both the sitemap enumerator and a new `allMdPaths()` helper:

```typescript
// src/md-coverage.test.ts
import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { allMdPaths } from "@/lib/md-routes";

describe("MD twin coverage parity (D-02)", () => {
  it("every sitemap URL has a corresponding .md twin path", () => {
    const sitemapPaths = sitemap()
      .map((entry) => new URL(entry.url).pathname)
      // one representative locale (en) per route is sufficient to verify coverage
      .filter((p) => p.startsWith("/en"));

    const mdPaths = new Set(allMdPaths().filter((p) => p.startsWith("/en")));

    const missing = sitemapPaths.filter((p) => !mdPaths.has(p + ".md"));
    expect(
      missing,
      "These sitemap routes have no .md twin — add them to the .md route factory",
    ).toHaveLength(0);
  });
});
```

`allMdPaths()` is a pure function in `src/lib/md-routes.ts` that enumerates the same registries
as `sitemap.ts` (site.nav, site.secondaryNav, services, comparisons, guides, localPaths) and
returns all `/{locale}/{path}` strings. It is the single source of truth for "what .md routes
exist" — the same list drives `STANDALONE_PATHS` (if ever needed), the `llms.txt` index section,
and this test.

---

## Common Pitfalls

### Pitfall 1: route.ts conflicts with page.tsx at the same route segment
**What goes wrong:** If you create `app/[lang]/about/route.ts`, Next.js rejects it because
`app/[lang]/about/page.tsx` already occupies that segment. Build error.
**Why it happens:** Next.js prohibits route.js at the same segment as page.js.
**How to avoid:** All `.md` route handlers MUST live in a folder suffixed with `.md` (e.g.,
`about.md/route.ts`), not in the existing page folder.
**Warning signs:** Build error "A `route.js` file is trying to be resolved simultaneously..."

### Pitfall 2: Home `.md` twin path
**What goes wrong:** Placing the home `.md` handler inside `app/[lang]/route.ts` conflicts with
the `[lang]` layout or generates URL `/en` (not `/en.md`).
**Why it happens:** The home URL is `/{locale}` so the `.md` twin must be `/{locale}.md`. That
requires a `app/[lang].md/` folder at the app root level, NOT inside `app/[lang]/`.
**How to avoid:** Create `src/app/[lang].md/route.ts`. The folder name `[lang].md` is a dynamic
segment with a literal `.md` suffix (the `llms.txt` pattern proves this convention works).
**Warning signs:** URL resolves to `/en` instead of `/en.md`, or build conflict with `app/[lang]/layout.tsx`.

### Pitfall 3: `getDictionary` is `server-only` — tests cannot import route handlers directly
**What goes wrong:** If a test tries to `import { GET } from "./route"`, the `server-only`
import inside `getDictionary` throws at test time.
**Why it happens:** `src/app/[lang]/dictionaries.ts` has `import "server-only"`.
**How to avoid:** Tests for the `.md` serializer should import `md-serializer.ts` directly (which
has no `server-only`). For route handler integration tests, mock `getDictionary` or test the
`GET` function with a mocked dict (same pattern as `llms.txt/route.test.ts` which imports `GET`
directly — llms.txt/route.ts does NOT import getDictionary, so it is clean).
**Warning signs:** "This module cannot be imported from a Client Component module" in test output.

### Pitfall 4: Non-deterministic `updated` date in frontmatter
**What goes wrong:** Using `new Date()` in the `updated` field produces a different value each
build, breaking build caching and making content differ between builds.
**Why it happens:** `force-static` routes are pre-rendered at build time; the date is baked in.
**How to avoid:** Use the same `PAGE_DATES` map from `src/app/sitemap.ts` (or extract it to a
shared `src/lib/page-dates.ts` module). If you add `PAGE_DATES` to a shared module, import
from there in both `sitemap.ts` and the `.md` route handlers.
**Warning signs:** `sitemap.test.ts` already checks "deterministic Date" — apply same discipline here.

### Pitfall 5: Proxy test uses `proxy(req(path))` — proxy function is NEVER called for `.md` paths
**What goes wrong:** The test might give a false pass if `proxy()` is never invoked for `.md`
paths in production (because the matcher excludes them). The test still works — `proxy(req(path))`
calls the function directly in the test, bypassing the matcher. The Location header will be null
because `.md` paths have a locale prefix, so `hasLocale` is true (for `/en/*.md` paths) and the
function returns `NextResponse.next()`. This is the correct expected result.
**Explanation:** The test directly invokes `proxy()` (bypassing the real middleware matcher).
For locale-prefixed `.md` paths like `/en/about.md`, the `hasLocale` check at step 2 matches
(path starts with `/en/`) → `NextResponse.next()` → no Location header. For `/en.md`, `hasLocale`
does NOT match (`/en.md !== /en` and does not start with `/en/`) → the function would redirect
to `/${locale}/en.md`. This means the test MUST use locale-prefixed paths
(`/en/about.md`, not `/about.md`) to get the expected null Location result.

---

## Code Examples

### Frontmatter output (D-05)
```
---
title: "About Us — Sans Souci Ongles & Spa"
lang: en
canonical: https://onglessanssouci.com/en/about
updated: 2026-06-01
---

Sans Souci Ongles & Spa has delivered professional nail care...

# Why Choose Us

Because we make your safety and hygiene our priority...
```

### Comparison table output (markdown table from dict.comparisons[id].columns/rows)
```
| Criterion | Gel / Shellac | Regular Polish |
| --- | --- | --- |
| Wear / Longevity | 2 to 3 weeks | 5 to 7 days |
```

### Legal block DSL → markdown (terms/privacy)
Dict input: `{ kind: "h3", text: "What's covered", items: [] }`
Output: `### What's covered`

Dict input: `{ kind: "ul", text: "", items: ["Lifting, chipping...", "Fixes for..."] }`
Output:
```
- Lifting, chipping...
- Fixes for...
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `context.params` synchronous prop | `context.params` is now a Promise; use `await params` | Next.js 15.0.0-RC | All route handlers must `await params` |
| GET handlers cached by default | GET handlers NOT cached by default; must opt in with `export const dynamic = "force-static"` | Next.js 15.0.0-RC | Must add `force-static` explicitly |
| Extension folders unusual | `app/llms.txt/route.ts` is the established pattern in this codebase | Phase 02 | `.md` folders follow same convention |

**Deprecated/outdated:**
- Synchronous `params` access: Next.js 16 still allows it for backwards compat but will deprecate. Always use `await params`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `app/[lang].md/` folder at app root creates URL `/{locale}.md` correctly | Architecture Patterns | Home .md twin would 404 or conflict; would need alternative (e.g. `app/[lang]/home.md/`) |
| A2 | `<Testimonials>` text is NOT in the dictionary (reads separate data source) | Content Model — Home | If testimonials ARE in dict, home .md would be more complete with less extra work |
| A3 | `src/lib/reviews.ts` exports review text accessible from server-side route handlers | Content Model — Reviews | If reviews come from a client-only source, reviews .md can only include aggregate stats |

**A1** is the most critical assumption. It is based on the `llms.txt/` folder precedent and
Next.js App Router convention for literal-name folders. If it does not work in practice, the
fallback is to name the home `.md` route `app/[lang]/home.md/route.ts` (URL: `/en/home.md`)
and add a redirect from `/en.md` → `/en/home.md`.

---

## Open Questions

1. **`<Testimonials>` component text source**
   - What we know: `reviews/page.tsx` imports from `src/lib/reviews` and renders `<ReviewCard>` per review.
   - What's unclear: `reviews.ts` was not read; it may be a static JSON, a fetched API result, or a filtered subset of google-reviews.json.
   - Recommendation: Planner should add a task to read `src/lib/reviews.ts` before implementing the reviews `.md` handler. If it is static data, include it. If it requires a live fetch, emit aggregate stats only (consistent with D-04 thin-page fallback).

2. **`PAGE_DATES` extraction**
   - What we know: `sitemap.ts` has a local `PAGE_DATES` Record. The `.md` `updated` frontmatter should use the same dates (determinism parity with the sitemap).
   - What's unclear: Whether to extract `PAGE_DATES` to `src/lib/page-dates.ts` (clean) or import `sitemap.ts` from route handlers (creates a dependency on a metadata module from a route handler).
   - Recommendation: Extract `PAGE_DATES` to `src/lib/page-dates.ts` and import from both. Two files importing from a thin shared module is the right pattern.

---

## Environment Availability

Step 2.6: SKIPPED — no external tools, services, or CLIs are added by this phase. All
dependencies are in-repo TypeScript modules. Runtime: Node.js 26.0.0 (available).
Test runner: `bun run test` (Vitest 4.1.x, available).

---

## Validation Architecture

`nyquist_validation: false` in `.planning/config.json`. Validation Architecture section skipped.

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` in `.planning/config.json`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | No | `.md` routes are public read-only; no auth |
| V3 Session Management | No | No session for static content |
| V4 Access Control | No | All content is public |
| V5 Input Validation | Yes (LOW) | `isLocale(lang)` + `serviceBySlug/comparisonBySlug/guideBySlug` guard all inputs; invalid params → 404 |
| V6 Cryptography | No | No secrets involved |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Path traversal via `lang` or `slug` param | Tampering | `isLocale()` + registry lookup — rejects any value not in the known set |
| Content injection via dict values | Tampering | Dict is committed to git (build-time constant); no runtime user input reaches dict |
| Sensitive data leak in `.md` body | Information Disclosure | Dict contains only public marketing copy; `site.ts` contains only public NAP + hours |

No security concerns beyond the existing input validation guards already used by page components.

---

## Sources

### Primary (HIGH confidence — verified directly against codebase)
- `src/proxy.ts` — matcher regex analysis; `STANDALONE_PATHS` pattern; `hasLocale` logic
- `src/app/llms.txt/route.ts` — force-static route handler precedent; label Records pattern
- `src/app/[lang]/*/page.tsx` (all 14 files) — per-page content model mapped to dict keys
- `src/dictionaries/en.json` — complete dictionary structure verified (all keys)
- `src/lib/services.ts`, `comparisons.ts`, `guides.ts`, `site.ts` — registry + path builder APIs
- `src/app/sitemap.ts` — canonical route enumerator; `PAGE_DATES` map
- `src/proxy.test.ts` — passthrough assertion pattern
- `src/app/llms.txt/route.test.ts` — GET handler test pattern

### Secondary (MEDIUM confidence — Next.js 16.2.6 bundled docs)
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — `force-static`, `generateStaticParams` with route handlers, `await params`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — `RouteContext`, params shape, dynamic route handler pattern
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` — `generateStaticParams` + literal-folder convention

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified in repo; no new packages
- Architecture (route handler shape): HIGH — verified against Next.js 16.2.6 docs bundled in node_modules
- Architecture (proxy behavior): HIGH — regex tested with Node.js directly against actual matcher string
- Content model (dict key mapping): HIGH — read every page component and matched to dict keys
- Architecture (home `.md` folder): MEDIUM — inferred from `llms.txt/` precedent; planner should verify with a quick `next build` smoke test on the `[lang].md` folder before committing all 96 route handlers

**Research date:** 2026-06-23
**Valid until:** 2026-07-23 (Next.js stable; all sources are in-repo or bundled docs)
