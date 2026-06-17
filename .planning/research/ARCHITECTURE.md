# Architecture Research

**Domain:** AI-search (SEO + GEO) content system — brownfield integration into Next.js 16 App Router nail salon site
**Researched:** 2026-06-17
**Confidence:** HIGH

---

## Context: What Already Exists

Do not rebuild what is already in place. The existing codebase already provides:

- `src/lib/seo.ts` — centralized schema builders: `businessGraph`, `serviceGraph`, `faqPageGraph`, `breadcrumbGraph`, `imageGalleryGraph`, `pageMetadata`
- `src/components/JsonLd.tsx` — server component that injects `<script type="application/ld+json">` (safe, server-only, no hydration duplication risk)
- `src/app/sitemap.ts` — multilingual sitemap with hreflang alternates covering nav, secondary nav, services, and comparisons
- `src/app/robots.ts` — allows all crawlers, points at sitemap
- `src/app/[lang]/faq/page.tsx` — existing FAQPage schema via `faqPageGraph` + `Accordion` component; items come from dictionary
- `src/app/[lang]/comparisons/[slug]/` — existing comparison pages with localized slugs per `src/lib/comparisons.ts`
- `src/proxy.ts` — STANDALONE_PATHS guard that must be updated for any new non-locale-prefixed routes

The GEO/SEO system adds a thin answer-content layer and two new crawl-surface artifacts on top of this foundation. It does not replace any existing layer.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI-Search Content System (new layer)                      │
│                                                                              │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────────────┐   │
│  │  Answer-Object   │  │  Schema Emitter  │  │  AI Crawl Surface        │   │
│  │  Page Templates  │  │  (extends seo.ts)│  │  llms.txt + sitemap ext  │   │
│  │  (content model) │  │                  │  │                          │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘  │
│           │                     │                          │                │
└───────────┼─────────────────────┼──────────────────────────┼────────────────┘
            │                     │                          │
            ▼                     ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               Existing Next.js 16 App Router Foundation                     │
│                                                                              │
│  src/lib/seo.ts ─── extended in place                                       │
│  src/components/JsonLd.tsx ─── reused as-is                                 │
│  src/app/[lang]/*/page.tsx ─── content added via dictionary + data files    │
│  src/app/sitemap.ts ─── extended with new page types                        │
│  src/app/robots.ts ─── updated for AI crawlers                              │
│  src/proxy.ts ─── STANDALONE_PATHS updated for llms.txt route               │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Analytics Layer                                      │
│   GA4 custom channel group (regex: chatgpt|perplexity|claude|gemini|...)    │
│   Edge referrer capture via middleware (supplements stripped-header cases)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | File Location | Communicates With |
|-----------|---------------|---------------|-------------------|
| **Answer-Object Template** | Page-level content model: quick-answer block (40-60 words), structured body sections, inline FAQ items | `src/app/[lang]/[page]/page.tsx` (extended), `src/dictionaries/*.json` | Schema Emitter (passes FAQ items), sitemap (page is crawled) |
| **Schema Emitter** | Extends `seo.ts` with new builders: `howToGraph`, `serviceAreaGraph`, enhanced `faqPageGraph` with per-item `acceptedAnswer`; sanitizes `<` → `<` before `JSON.stringify` | `src/lib/seo.ts` | `JsonLd.tsx` (consumed), page server components (called at render) |
| **JsonLd.tsx** | Injects `<script type="application/ld+json">` in server render; already exists, no changes needed | `src/components/JsonLd.tsx` | Called by every page that emits schema |
| **llms.txt Route** | Serves `/llms.txt` as `text/plain` markdown; lists the salon's key pages, services, and Q&A summary for AI context windows; statically generated at build | `src/app/llms.txt/route.ts` | Must be registered in `STANDALONE_PATHS` in `src/proxy.ts` |
| **Sitemap Extension** | Adds FAQ hub, new service detail pages, comparison pages (already present) to sitemap with correct `alternates.languages` hreflang maps and `x-default` | `src/app/sitemap.ts` (extended in place) | Crawler / AI indexer entry point |
| **robots.txt Extension** | Adds AI crawler user-agent clauses (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`) with explicit allow, preserves existing allow-all default | `src/app/robots.ts` (extended in place) | Crawler access control |
| **Analytics Layer** | GA4 custom channel group with regex covering ChatGPT, Perplexity, Claude, Gemini, Copilot; optional edge-middleware referrer capture for stripped-header AI sessions | `src/app/[lang]/layout.tsx` (gtag/GA4 wiring) + GA4 admin config | Feeds conversion event tracking per PROJECT.md spec |
| **FAQ Hub Page** | `/[lang]/faq` already exists; extended with categorized FAQ sections, richer `acceptedAnswer` text (40-60 word direct answers), and `speakable` selectors | `src/app/[lang]/faq/page.tsx` + `src/dictionaries/*.json` (faq key) | Schema Emitter, sitemap |

---

## Data Flow

### Page Render → Schema → Crawler

```
Dictionary JSON (src/dictionaries/en.json)
    │  faq.items, services, comparisons copy
    ▼
Page Server Component (src/app/[lang]/*/page.tsx)
    │  awaits getDictionary(lang)
    │  calls seo.ts builders: faqPageGraph(items), serviceGraph(...), breadcrumbGraph(...)
    ▼
JsonLd.tsx server component
    │  <script type="application/ld+json">  ← sanitized JSON.stringify output
    │  rendered into HTML at SSR time
    ▼
HTML response served to browser + crawlers
    │
    ├── Google / Bing: reads JSON-LD for rich results, entity recognition
    ├── GPTBot / ClaudeBot / PerplexityBot: crawls HTML, reads structured data
    └── AI answer engines: use FAQPage/Service schema to extract Q&A pairs
```

### llms.txt Flow

```
Build time (next build)
    │
    ├── src/app/llms.txt/route.ts (export const dynamic = 'force-static')
    │       reads site constants from src/lib/site.ts
    │       reads services list from src/lib/services.ts
    │       constructs markdown: H1 salon name, blockquote summary, ## sections with links
    │
    ▼
/llms.txt served as text/plain at onglessanssouci.com/llms.txt
    │
    └── AI context windows use it as a curated map of the site's authoritative pages
        (adoption is emerging, not universal — low-cost, no downside to publishing)
```

### Analytics: AI Referrer Attribution

```
Browser session lands on site
    │
    ├── document.referrer contains chatgpt.com / perplexity.ai / claude.ai → captured by GA4
    │       GA4 native AI Assistant channel (covers ChatGPT, Gemini, Claude from May 2026)
    │       PLUS custom channel group regex for Perplexity, Copilot, others
    │
    └── Referrer stripped (mobile AI apps ~70% of AI traffic) → lands as Direct
            Edge middleware can log User-Agent + Referer at request time
            to a lightweight server log or custom GA4 event for partial recovery

GA4 → Session channel group → AI traffic segment → landing page analysis
    → identifies which pages are being cited by AI engines
```

---

## Recommended Project Structure (additions only)

```
src/
├── app/
│   ├── llms.txt/
│   │   └── route.ts          # GET handler, force-static, text/plain
│   └── [lang]/
│       └── faq/
│           └── page.tsx      # Extended: richer acceptedAnswer text in dict
├── lib/
│   └── seo.ts                # Extended: howToGraph(), sanitize helper, serviceAreaGraph()
└── dictionaries/
    └── en.json               # Extended: faq.items with 40-60 word answers per item
        fr.json               # Same
        es.json               # Same
        ar.json               # Same
```

No new top-level directories. No new shared components required. The answer-object content model is a data pattern enforced in the dictionaries and page copy, not a new React component.

---

## Architectural Patterns

### Pattern 1: Schema-First Content Authoring

**What:** Write dictionary FAQ items so that the `q` (question) and `a` (answer) fields satisfy the FAQPage `acceptedAnswer` requirement directly — the answer text is the structured data payload, not a byproduct of it.

**When to use:** Every FAQ item added to `src/dictionaries/*.json` under the `faq.items` key.

**Why:** The existing `faqPageGraph(items)` in `seo.ts` already maps `items` to `mainEntity` Question/Answer pairs. If the `a` field contains a 40-60 word direct answer (no fluff, no HTML tags), the schema emitter can emit it as-is. No separate "schema answer" vs "display answer" duplication.

**Constraint:** Keep answers free of `<` characters to avoid the `dangerouslySetInnerHTML` XSS surface in `JsonLd.tsx`. If markdown or HTML must appear in display, maintain separate `answerHtml` and `answerText` fields — the schema emitter uses `answerText`.

```typescript
// src/dictionaries/en.json (illustrative shape)
"faq": {
  "items": [
    {
      "q": "How long do gel nails last?",
      "a": "Gel nails typically last 2 to 3 weeks without chipping. Longevity depends on nail prep, your daily activities, and aftercare. We recommend a fill every 2-3 weeks to keep them looking fresh.",
      "category": "gel"
    }
  ]
}
```

### Pattern 2: llms.txt as a Static Route Handler

**What:** `src/app/llms.txt/route.ts` exports a `GET` function returning `new Response(content, { headers: { 'Content-Type': 'text/plain' } })` with `export const dynamic = 'force-static'`.

**When to use:** Single file, built once at deploy time.

**Why:** App Router route handlers with `force-static` are emitted as static files at build time, identical to a `public/llms.txt` file but composable with TypeScript imports (can pull from `site.ts`, `services.ts`, `comparisons.ts` to keep the file in sync with the codebase automatically).

**STANDALONE_PATHS coupling:** `/llms.txt` must be added to `STANDALONE_PATHS` in `src/proxy.ts`. Without this, the middleware will attempt to locale-prefix it to `/en/llms.txt`, returning a 404. Follow the pattern established by `/queue`, `/checkin`, etc. Add a test in `src/proxy.test.ts` (pattern: lines 22-25).

```typescript
// src/app/llms.txt/route.ts
import { site } from "@/lib/site";
import { services } from "@/lib/services";

export const dynamic = "force-static";

export async function GET() {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.name} is a nail salon and spa at ${site.contact.landmark}, ${site.contact.address.city}. ` +
    `Services include manicures, pedicures, gel nails, lash extensions, and waxing. ` +
    `Open 7 days. Book online or call ${site.contact.phone}.`,
    "",
    "## Key Pages",
    "",
    ...site.nav.map((n) => `- [${n.key}](${site.url}/en${n.href === "/" ? "" : n.href})`),
    "",
    "## Services",
    "",
    ...services.map((s) => `- [${s.id}](${site.url}/en/services/${s.slug.en})`),
    "",
    "## FAQ",
    `- [Frequently Asked Questions](${site.url}/en/faq)`,
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

### Pattern 3: Layered Schema per Page Type

**What:** Each page emits only the schema types relevant to its content. Pages that answer questions add FAQPage. Service pages add Service + Offer. The FAQ hub emits FAQPage + BreadcrumbList. The homepage already emits NailSalon + WebSite.

**Layering rules (confirmed by Google guidance 2026):**
- `NailSalon` + `WebSite` → homepage (already implemented)
- `Service` + `Offer` + `FAQPage` (inline 2-3 items) → service detail pages
- `FAQPage` (full) + `BreadcrumbList` → `/faq` hub (already implemented, extend answer quality)
- `Article` or `HowTo` + `BreadcrumbList` → comparison pages
- `ImageGallery` + `BreadcrumbList` → gallery (already implemented)

**Why HowTo over SpecialAnnouncement:** Google deprecated `SpecialAnnouncement` rich results in January 2026. `HowTo` remains valid and maps well to comparison content ("how to choose between gel vs regular").

**Why not SpeakableSpecification:** Treat as a phase-N micro-optimization. Prioritize `FAQPage` and `Service` schema correctness first.

### Pattern 4: Sitemap Extension Without Breaking Existing Hreflang

**What:** New page types (e.g., expanded FAQ categories, future service areas) are added to `sitemap.ts` following the existing `locales.flatMap` × `pages.map` pattern, always including the full `alternates.languages` object for every locale.

**Critical rule (confirmed by Next.js 16 docs):** Every URL in `alternates.languages` must be bidirectional — if `/en/faq` lists `/fr/faq` as its French alternate, then `/fr/faq` must list `/en/faq` as its English alternate. The existing `locales.flatMap` loop handles this correctly. Do not add new entries as one-off objects without the full alternates map.

**x-default:** Add `x-default` pointing to the English URL for each entry. Not currently present in the sitemap — add it when extending.

---

## Anti-Patterns

### Anti-Pattern 1: Creating a New `/llms.txt` Page Without STANDALONE_PATHS

**What happens:** `src/app/llms.txt/route.ts` is created but `/llms.txt` is not added to `STANDALONE_PATHS` in `src/proxy.ts`.

**Consequence:** Middleware intercepts the request and 301-redirects `/llms.txt` to `/en/llms.txt`, which does not exist. AI crawlers that follow the standard `/llms.txt` path get a 404.

**Prevention:** Add `"/llms.txt"` to `STANDALONE_PATHS` in `src/proxy.ts` and add a test in `src/proxy.test.ts`. This is the same failure mode that previously bit `/clientportal` and `/subscription`.

### Anti-Pattern 2: XSS via Untrusted Data in JSON-LD

**What happens:** FAQ answer text pulled from an external CMS or future admin panel is injected into `JsonLd.tsx` via `JSON.stringify` without sanitization.

**Consequence:** A `</script>` substring in an answer string breaks out of the JSON-LD block, enabling XSS injection in the HTML response.

**Prevention:** The current `JsonLd.tsx` comment says "payload is our own serialised object, never user input." This is safe while FAQ content lives in committed dictionary files. If content ever moves to an admin-editable source (Supabase), add a sanitization step in `seo.ts` before the graph builders return: replace `<` with `<` in all string fields. Add this to `seo.ts` as a `sanitizeForJsonLd(s: string)` helper and apply it to all builder output.

### Anti-Pattern 3: Separate "Display Answer" and "Schema Answer" Divergence

**What happens:** The visible page copy and the `acceptedAnswer` in the FAQPage schema say different things — the schema has a terse placeholder while the page has the real answer.

**Consequence:** Google can penalize or ignore structured data that misrepresents page content. AI engines that cross-reference schema with visible text lose trust in the source.

**Prevention:** Use the same `items[].a` field from the dictionary as both the visible text (in `Accordion`) and the schema answer (in `faqPageGraph`). If the display needs rich HTML formatting, add an `answerHtml` field for display only — the schema always uses the plain `a` field.

### Anti-Pattern 4: Regenerating `lastModified` on Every Build

**What happens:** `sitemap.ts` uses `new Date()` as `lastModified` for all entries, causing every page to appear changed on every build.

**Consequence:** Crawlers re-crawl every page on every deploy, wasting crawl budget and diluting the freshness signal on pages that actually changed.

**Prevention:** Use a static build date or, better, per-page timestamps stored in the data source. For static content (dictionary-driven pages), use the `git log --format=%cI` date of the dictionary file as the `lastModified` value — read it during `next build` via a build-time script and export it as a constant. For now, this is a known limitation in the existing sitemap; flag it for the sitemap extension phase.

### Anti-Pattern 5: Injecting Analytics Script Without Locale Layout Awareness

**What happens:** GA4 gtag snippet is added to `src/app/[lang]/layout.tsx` but duplicated across standalone layouts (`/queue/layout.tsx`, `/subscription/layout.tsx`, etc.).

**Consequence:** Analytics fires on kiosk pages (queue, check-in), polluting conversion data with internal/operational sessions.

**Prevention:** GA4 goes only in `src/app/[lang]/layout.tsx` — the locale-prefixed public tree. Standalone layouts (`/queue`, `/checkin`, `/clientportal`, `/subscription`) should not include GA4.

---

## Build Order (Dependencies Between Components)

Build these in this order because each phase depends on what the previous one establishes:

**Phase 1 — Schema Emitter hardening (foundation for everything)**
- Sanitize `JsonLd.tsx` / `seo.ts` output (`<` escaping) before any external data flows in
- Add `howToGraph()` builder to `seo.ts` for comparison pages
- Extend `faqPageGraph` to support per-item `category` field
- No new routes, no visible user change — purely defensive

**Phase 2 — FAQ hub content enrichment**
- Rewrite dictionary `faq.items` answers to 40-60 word direct-answer format in all four locales
- Organize items by category (gel, pedicure, booking, lash, wax)
- The existing `FaqPage` server component and `Accordion` pick these up automatically
- Sitemap already includes `/faq` — no changes needed there

**Phase 3 — Service page answer blocks (answer-object template)**
- Add `quickAnswer` and `inlineFaq` fields to service dictionary entries
- Service pages emit `Service` + `Offer` + inline `FAQPage` (2-3 Q&A per service)
- Extend `sitemap.ts` to include service detail pages if not already present

**Phase 4 — llms.txt**
- Create `src/app/llms.txt/route.ts`
- Add `/llms.txt` to `STANDALONE_PATHS` in `src/proxy.ts`
- Add proxy test assertion
- Update `robots.ts` to add AI crawler user-agent clauses

**Phase 5 — Sitemap extension + robots hardening**
- Add `x-default` to all sitemap entries
- Add FAQ category pages to sitemap if implemented
- Set accurate `lastModified` values (at minimum, use a per-build date constant instead of `new Date()`)

**Phase 6 — Analytics layer**
- Wire GA4 in `src/app/[lang]/layout.tsx` (scope: locale-prefixed pages only)
- Configure GA4 custom channel group with AI-referrer regex
- Add conversion events: call click, form submit, booking click

---

## Integration Notes: Next.js 16 App Router + i18n/Proxy

### The STANDALONE_PATHS contract (critical)

Every route that does NOT want a locale prefix must be in `STANDALONE_PATHS` in `src/proxy.ts`. The proxy matcher excludes `/api/*` and `/_next/*` automatically (see the `matcher` export), but plain text/file-extension routes like `/llms.txt` are caught by the matcher's file-extension exclusion (`.*\\..*` in the negative lookahead) — however, the `.txt` extension IS matched by `.*\\..*`, so `/llms.txt` is actually excluded from the locale-routing matcher and does NOT need a STANDALONE_PATHS entry. Verify this during implementation by checking the proxy matcher regex: `/((?!_next|api|.*\\..*).*)/`. The `.*\\..*` clause exempts paths containing a dot from locale prefixing, which covers `/llms.txt`. Add a proxy test regardless to lock in the behavior explicitly.

### i18n dictionary pattern for new content

All new answer copy follows the existing dictionary pattern:
1. Add keys to `src/dictionaries/en.json` (English as the source of truth)
2. Mirror the same key path in `fr.json`, `es.json`, `ar.json`
3. Update the `Dictionary` type in `src/lib/dictionary.ts` when adding new top-level keys
4. For RTL (`ar`), verify answer text reads correctly with `dirFor(lang)` — the layout already applies `dir` to `<html>`

### Schema builders: extend in place, not alongside

Add new graph builders (`howToGraph`, `serviceAreaGraph`) as additional named exports in `src/lib/seo.ts`. Do not create a parallel `geo-seo.ts` or `schema.ts` — splitting the schema layer creates import confusion and diverges from the existing "single source of truth" convention documented in `seo.ts`.

### Sitemap hreflang: bidirectionality is required

The existing `locales.flatMap` × page loop handles bidirectionality correctly (every locale is listed in every entry's `alternates.languages`). When adding new page types, use the exact same pattern. Adding entries as flat objects without the full alternates map breaks Google's hreflang interpretation (one-way declarations are ignored).

---

## Scaling Considerations

This is a single-location Montreal salon. Scale concerns are content volume, not traffic volume.

| Concern | Current Scale | If Content Expands |
|---------|--------------|-------------------|
| Dictionary file size | 4 JSON files, small | Split into `faq.json`, `services.json` per locale if files exceed ~500 lines |
| Sitemap entry count | ~40 entries | Next.js splits sitemaps at 50,000 entries automatically; not a concern here |
| Schema duplication | LocalBusiness once via layout | Avoid emitting full business graph on every page; reference by `@id` on sub-pages |
| Build time | Negligible | `force-static` on `llms.txt` route adds zero runtime cost |

---

## Sources

- [Next.js JSON-LD guide (official)](https://nextjs.org/docs/app/guides/json-ld)
- [GA4 AI Assistant channel and AI traffic tracking](https://authoritytech.io/blog/ai-traffic-attribution-how-to-track-chatgpt-perplexity-gemini)
- [llms.txt specification — llmstxt.org / Jeremy Howard proposal](https://searchengineland.com/llms-txt-proposed-standard-453676)
- [Structured data for AI visibility 2026](https://www.stackmatix.com/blog/structured-data-ai-search)
- [GEO content structure: 40-60 word answer pattern, FAQPage best practices](https://llmpulse.ai/blog/glossary/structured-data-for-ai/)
- [HowTo and FAQPage rich result status after March 2026 Google update](https://developers.google.com/search/docs/appearance/structured-data/speakable)
- [XSS in Next.js JSON-LD: sanitization approach](https://shahin.page/article/jsonld-nextjs-seo-schema-structured-data-sanitization)
- [Sitemap hreflang bidirectionality requirement](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps)

---

*Architecture research for: AI-search (SEO + GEO) content system — Ongles Sans Souci*
*Researched: 2026-06-17*
