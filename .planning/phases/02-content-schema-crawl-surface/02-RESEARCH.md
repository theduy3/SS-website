# Phase 2: Content, Schema & Crawl Surface — Research

**Researched:** 2026-06-17
**Domain:** Next.js 16 App Router — JSON-LD schema wiring, i18n dictionary system, route handlers, sitemap hygiene, SSR content discipline
**Confidence:** HIGH — all findings sourced directly from the project codebase

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Expand the existing `/faq` route in place. Grow `dict.faq.items` to ~8–15 concise, factual Q/As (hours, booking, parking at CF Carrefour Laval, services, pricing, walk-ins) across all 4 locales.
- **D-02:** SCHEMA-02 structurally satisfied by construction — the `/faq` route feeds the same `dict.faq.items` into both `faqPageGraph()` (schema) and `<Accordion>` (visible copy). Never let schema text and visible text diverge.
- **D-03:** Answer-first = a lead-paragraph (not a callout box), dictionary-driven, rendered at the top of the page in SSR HTML.
- **D-04:** Apply answer-first to content pages only: home, services index, each `/services/[slug]`, the FAQ hub, the Laval page, and about. Exclude legal/utility/comparisons pages.
- **D-05:** Build a dedicated `/laval` route under normal `[lang]` locale routing — single slug `laval` across all 4 locales. It is NOT in `STANDALONE_PATHS`.
- **D-06:** Laval page = answer-first block + location/parking/transit/landmark facts + 3–5 Laval-specific FAQ Q/As with their own `FAQPage` schema. Reciprocal hreflang across all 4 locales. Sitemap entry required.
- **D-07:** This is the Laval local page (not Montreal) — reconciles Phase-1 D-02.
- **D-08:** `/llms.txt` = curated business brief in EN (summary, NAP from `site.ts`, services list, hours, booking/contact links, key-page links, note that fr/es/ar exist).
- **D-09:** Implement `/llms.txt` as a `force-static` App Router route handler (`src/app/llms.txt/route.ts`). MUST add `/llms.txt` to `STANDALONE_PATHS` in `src/proxy.ts` AND add a `src/proxy.test.ts` assertion before merge. Build will NOT catch a missing entry.
- **D-10:** Claude drafts factual EN copy first; user reviews EN; only after EN approval are fr/es/ar translated. Schema reads the same dictionary keys — verbatim match preserved automatically.

### Claude's Discretion

- **Service-page FAQPage emission:** Wire `faqPageGraph()` onto each `/services/[slug]` page using per-service FAQ data already in `serviceDetails[id].faq` in the dictionaries.
- **AggregateRating gate (SCHEMA-03):** Keep behind the existing `reviewsFetchedAt` gate in `organizationGraph()` — do not bypass.
- **Sitemap hygiene (CRAWL-02):** Add `x-default` alternate and replace `lastModified = new Date()` with accurate per-page modification dates; add the new `/laval` route. Approach (static date constants) is Claude's call.
- **Per-route schema audit:** Confirm home + services-index also emit expected blocks; fill any gaps found.

### Deferred Ideas (OUT OF SCOPE)

- Categorized/sectioned FAQ hub with anchors
- Answer-first on legal/utility pages and `/comparisons/[slug]`
- Per-locale Laval slug (e.g. `/laval-salon-ongles`)
- Per-service standalone FAQ pages

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCHEMA-01 | Every key route emits expected JSON-LD (Service / FAQPage / BreadcrumbList) in server-rendered HTML, verified per route | Builders already exist in `seo.ts`; gaps identified: home missing `servicesGraph`, service `[slug]` missing `faqPageGraph`, Laval page is new |
| SCHEMA-02 | FAQPage schema text matches visible SSR FAQ copy verbatim | Single-source pattern: `dict.faq.items` feeds both `faqPageGraph()` and `<Accordion>` in `/faq/page.tsx` — replicate for Laval page |
| SCHEMA-03 | AggregateRating emitted only through existing review-fetch gate | Gate already implemented via `reviewsFetchedAt` in `organizationGraph()` — do not touch |
| CONTENT-01 | Each key page opens with a direct 40–60-word answer block in first screen, SSR-rendered | Add `dict.[page].lead` keys to all 4 locale dictionaries; render as `<p>` before `<PageHeader>` in each page component |
| CONTENT-02 | FAQ knowledge hub published with concise factual Q/As in en/fr/es/ar; copy, schema, and SSR ship atomically | Expand `dict.faq.items` in all 4 dictionaries; all 4 locale variants must ship simultaneously for hreflang reciprocity |
| CONTENT-03 | One Laval local page with neighborhood-level FAQ signals, SSR-rendered | New `src/app/[lang]/laval/page.tsx`; new dictionary keys in all 4 locales; follows existing page pattern exactly |
| CRAWL-01 | `/llms.txt` served via App Router route handler (force-static), with `proxy.test.ts` assertion | New `src/app/llms.txt/route.ts`; add to `STANDALONE_PATHS`; add proxy test — hard merge gate |
| CRAWL-02 | `sitemap.ts` emits accurate `lastModified` + `x-default`; no orphan pages | `x-default` already supported by `MetadataRoute.Sitemap.alternates.languages` as a string key; `lastModified` currently always `new Date()` — replace with static date constants |

</phase_requirements>

---

## Summary

Phase 2 is primarily wiring and content discipline, not new infrastructure. Every schema builder needed (`faqPageGraph`, `serviceGraph`, `breadcrumbGraph`, `organizationGraph`, `servicesGraph`) already exists in `src/lib/seo.ts`. The dictionary system (`src/dictionaries/{en,fr,es,ar}.json` typed as `Dictionary` in `src/lib/dictionary.ts`) is the single source for both visible copy and schema text. The `[lang]` App Router layout at `src/app/[lang]/layout.tsx` already emits `organizationGraph` sitewide.

The four concrete gaps to close: (1) service `[slug]` pages call `serviceGraph` but not `faqPageGraph` — the per-service FAQ data already exists in `serviceDetails[id].faq`; (2) the home page has no `JsonLd` calls of its own (only inherits from layout); (3) the FAQ hub has only 11 items and needs expansion to ~15 across all 4 locales simultaneously; (4) the `/llms.txt` route and the `/laval` page do not exist yet.

The STANDALONE_PATHS coupling in `src/proxy.ts` is the single highest-risk item: a missing entry causes a runtime 404 that the build never surfaces. The pattern and test shape are already proven by `/clientportal`, `/checkin`, `/subscription`, and `/queue`.

**Primary recommendation:** Work in dictionary-first vertical slices: write EN copy → get approval → translate × 3 → add dictionary keys → wire schema/render → verify with `curl`. Never let schema and visible copy be maintained separately.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| JSON-LD schema emission | Frontend Server (SSR) | — | `<JsonLd>` is a Server Component; schema must be in raw HTML, not client JS |
| Dictionary / copy | Frontend Server (SSR) | — | `getDictionary()` is `server-only`; dictionaries load at request time on server |
| hreflang / canonical metadata | Frontend Server (SSR) | — | `pageMetadata()` → Next.js `<head>` metadata API, emitted server-side |
| Locale routing / proxy | Frontend Server (SSR) | — | `src/proxy.ts` middleware runs at edge before rendering |
| `/llms.txt` route handler | Frontend Server (SSR) | CDN / Static | `force-static` makes it a build-time static file served without SSR overhead |
| Sitemap | Frontend Server (SSR) | CDN / Static | `sitemap.ts` is a cached Route Handler, rendered once at build |
| Answer-first lead paragraph | Frontend Server (SSR) | — | Plain `<p>` in page Server Component — no client JS |
| AggregateRating gate | API / Backend | — | `reviewsFetchedAt` flag set by `scripts/fetch-google-reviews.mjs` at build time |

---

## Standard Stack

### Core (all already installed — no new installs needed for this phase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.6 | App Router SSR, route handlers, sitemap | Project framework — all patterns confirmed from `node_modules/next/dist/docs/` |
| React | 19.2.4 | Server Components for schema/content | Project framework |
| TypeScript | (project) | Type safety on dictionary shape via `Dictionary = typeof en` | Project standard |
| Vitest | (project) | Unit tests, `bun run test` | Existing test framework — `vitest.config.ts` present |

### Existing Project Utilities (extend, do not replace)

| Module | Path | Role in Phase 2 |
|--------|------|-----------------|
| `seo.ts` | `src/lib/seo.ts` | All JSON-LD builders — call, never rewrite |
| `site.ts` | `src/lib/site.ts` | NAP source of truth for llms.txt content |
| `i18n.ts` | `src/lib/i18n.ts` | `locales`, `isLocale`, `dirFor`, `LangParams` |
| `dictionary.ts` | `src/lib/dictionary.ts` | `Dictionary` type — extend when adding new keys |
| `JsonLd.tsx` | `src/components/JsonLd.tsx` | Escaped JSON-LD inline — use as-is (Phase 1 FOUND-01) |
| `PageHeader.tsx` | `src/components/PageHeader.tsx` | Title band used by all inner routes |
| `Accordion.tsx` | `src/components/Accordion.tsx` | FAQ rendering — takes `{ q, a }[]` |
| `proxy.ts` | `src/proxy.ts` | `STANDALONE_PATHS` — add `/llms.txt` here |
| `proxy.test.ts` | `src/proxy.test.ts` | Add `llms.txt` assertion — hard merge gate |
| `sitemap.ts` | `src/app/sitemap.ts` | Extend with Laval entry + x-default + accurate lastModified |

### No New Package Installs

This phase requires zero new npm packages. All capabilities are already in the project.

---

## Package Legitimacy Audit

No external packages are installed in this phase. This section is intentionally empty.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | — |

---

## Architecture Patterns

### System Architecture Diagram

```
Dictionary files (en/fr/es/ar.json)
        │
        ▼
getDictionary(lang)          ← server-only, per request
        │
        ├──► dict.faq.items ──► faqPageGraph() ──► <JsonLd> ──► raw HTML <script ld+json>
        │                  └──► <Accordion>   ──► raw HTML visible copy
        │                       [SCHEMA-02: single source guarantees verbatim match]
        │
        ├──► dict.[page].lead ──► <p> lead paragraph ──► raw HTML (first element)
        │                        [CONTENT-01: SSR, before <PageHeader>]
        │
        ├──► dict.laval.* ──────► /[lang]/laval/page.tsx ──► SSR HTML
        │                         + faqPageGraph() + breadcrumbGraph()
        │
        └──► (for service pages)
             dict.serviceDetails[id].faq ──► faqPageGraph() ──► <JsonLd>
             (alongside existing serviceGraph + breadcrumbGraph)

site.ts (NAP) ──► organizationGraph() ──► layout.tsx <JsonLd> (sitewide, already working)
              └──► llms.txt route.ts  ──► GET() ──► text/plain response (force-static)

src/proxy.ts STANDALONE_PATHS
        └── "/llms.txt"  ◄── MUST be added (build won't catch absence)
        └── proxy.test.ts assertion ◄── hard merge gate

src/app/sitemap.ts
        └── adds /laval entries (4 locale variants + x-default)
        └── adds "x-default" key to all alternates.languages maps
        └── replaces lastModified = new Date() with static date constants
```

### Recommended Project Structure (Phase 2 additions only)

```
src/
├── app/
│   ├── llms.txt/
│   │   └── route.ts          # NEW: force-static GET handler, text/plain
│   └── [lang]/
│       └── laval/
│           └── page.tsx      # NEW: follows faq/page.tsx pattern exactly
├── dictionaries/
│   ├── en.json               # EXTEND: add lead keys + laval section + FAQ items
│   ├── fr.json               # EXTEND: same shape
│   ├── es.json               # EXTEND: same shape
│   └── ar.json               # EXTEND: same shape (RTL — dirFor(lang) handles render)
└── app/
    ├── sitemap.ts            # MODIFY: x-default + lastModified + laval
    ├── [lang]/faq/page.tsx   # MODIFY: add dict.faq.lead paragraph before <PageHeader>
    ├── [lang]/page.tsx       # MODIFY: add dict.home.lead paragraph + servicesGraph JsonLd
    ├── [lang]/about/page.tsx # MODIFY: add dict.about.lead paragraph
    ├── [lang]/services/page.tsx       # MODIFY: add dict.servicesPage.lead paragraph
    └── [lang]/services/[slug]/page.tsx # MODIFY: add faqPageGraph JsonLd + lead paragraph
```

### Pattern 1: Answer-First Lead Paragraph (CONTENT-01, D-03)

**What:** A single `<p>` tag, 40–60 words, factual, SSR-rendered as the FIRST readable element in the page fragment — before `<PageHeader>`, before `<JsonLd>` wrappers.

**When to use:** Home, services index, each service slug, FAQ hub, Laval page, about page (D-04).

**UI contract (from 02-UI-SPEC.md):**
```typescript
// Placement: outermost <> fragment, before any <JsonLd> or <section>
// Styling: max-w-3xl px-6 pt-8 md:pt-12 text-lg leading-relaxed text-mocha
// RTL: add dir={dirFor(lang)} on the <p> for Arabic

// Source: project codebase — faq/page.tsx structure + UI-SPEC contract
export default async function ExamplePage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      {/* Answer-first lead — must be first readable element in SSR HTML */}
      <p className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
         dir={dirFor(lang)}>
        {dict.home.lead}
      </p>
      <JsonLd data={...} />
      <PageHeader title={dict.hero.tagline} />
      {/* rest of page */}
    </>
  );
}
```

### Pattern 2: FAQPage Schema on Service Pages (SCHEMA-01, Claude's Discretion)

**What:** Add `<JsonLd data={faqPageGraph(d.faq)} />` to `services/[slug]/page.tsx` alongside existing `serviceGraph` and `breadcrumbGraph`. The `d.faq` array (`serviceDetails[id].faq`) already exists in all 4 locale dictionaries (4 items per service confirmed).

```typescript
// Source: project codebase — src/app/[lang]/services/[slug]/page.tsx (lines 57-73) + seo.ts faqPageGraph
// Add after existing serviceGraph and breadcrumbGraph JsonLd blocks:
<JsonLd data={faqPageGraph(d.faq)} />
// d = dict.serviceDetails[service.id]  -- already loaded in the page
// faqPageGraph signature: faqPageGraph(items: readonly { q: string; a: string }[])
```

### Pattern 3: llms.txt Route Handler (CRAWL-01, D-09)

**What:** App Router route handler at `src/app/llms.txt/route.ts` — returns `text/plain` with business brief. File path `llms.txt` makes Next.js serve it at `/llms.txt`.

```typescript
// Source: node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
// force-static caches at build time; no runtime cost
export const dynamic = "force-static";

import { site } from "@/lib/site";
import { services } from "@/lib/services";

export function GET() {
  const body = buildLlmsTxt(); // assembled from site.ts constants
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

**STANDALONE_PATHS coupling — mandatory two-step (build will not catch omission):**

Step 1 — Add to `src/proxy.ts`:
```typescript
const STANDALONE_PATHS = new Set([
  "/checkin",
  "/queue",
  "/clientportal",
  "/subscription",
  "/llms.txt",   // ADD THIS
]);
```

Step 2 — Add to `src/proxy.test.ts` (mirror existing assertion shape):
```typescript
it("does not locale-prefix /llms.txt (T: route reachable un-prefixed)", async () => {
  const res = await proxy(req("/llms.txt"));
  expect(res.headers.get("location")).toBeNull();
});
```

### Pattern 4: Laval Page (CONTENT-03, D-05/D-06)

**What:** New page at `src/app/[lang]/laval/page.tsx`. Follows `faq/page.tsx` structure exactly. Single shared slug `laval` across all 4 locales (NOT localized slug — no `routeByLocale` needed, plain `pageMetadata(lang, "/laval", {...})`).

```typescript
// Source: project codebase — src/app/[lang]/faq/page.tsx pattern
export default async function LavalPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <p className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
         dir={dirFor(lang)}>
        {dict.laval.lead}
      </p>
      <JsonLd data={faqPageGraph(dict.laval.faq)} />
      <JsonLd data={breadcrumbGraph(lang, [
        { name: dict.nav.home, route: "" },
        { name: dict.laval.title, route: "/laval" },
      ])} />
      <PageHeader title={dict.laval.title} intro={dict.laval.intro} />
      {/* location facts section */}
      {/* FAQ accordion */}
    </>
  );
}
```

### Pattern 5: Sitemap x-default and lastModified (CRAWL-02)

**What:** `MetadataRoute.Sitemap` `alternates.languages` accepts `"x-default"` as a plain string key (confirmed from Next.js 16 sitemap docs — `alternates.languages` is `Record<string, string>`). The `seo.ts` `languageAlternates()` helper already adds `x-default → /fr/...` for page metadata, but `sitemap.ts` builds its own `languages` maps without `x-default`.

```typescript
// Source: project codebase — src/app/sitemap.ts + Next.js 16 sitemap docs
// BEFORE (current — missing x-default):
alternates: {
  languages: Object.fromEntries(
    locales.map((l) => [l, `${site.url}/${l}${toPath(item.href)}`]),
  ),
},

// AFTER (fix — add x-default pointing to defaultLocale = "fr"):
alternates: {
  languages: {
    ...Object.fromEntries(
      locales.map((l) => [l, `${site.url}/${l}${toPath(item.href)}`])
    ),
    "x-default": `${site.url}/${defaultLocale}${toPath(item.href)}`,
  },
},
```

**lastModified approach:** Replace `const lastModified = new Date()` with per-section static date constants. Simplest approach that avoids git-mtime complexity at build time:

```typescript
// Static dates reflect when content was last meaningfully changed.
// Update these when content actually changes — do NOT keep as new Date().
const LAST_MODIFIED_NAV = new Date("2026-06-17");
const LAST_MODIFIED_SERVICES = new Date("2026-06-17");
const LAST_MODIFIED_FAQ = new Date("2026-06-17"); // update when FAQ content changes
const LAST_MODIFIED_LAVAL = new Date("2026-06-17"); // new page
```

### Anti-Patterns to Avoid

- **Schema-only content:** Never add text to `faqPageGraph()` arguments that does not appear in the visible `<Accordion>` or `<p>`. SCHEMA-02 is violated the moment schema text and rendered text diverge.
- **Client-only answer blocks:** Never render the lead paragraph inside a `"use client"` component or with `Reveal` delay. The `curl` verification must see the text before any JS runs. `Reveal` wraps children in a motion div — the text IS in SSR HTML but Google's static parser sees it; however, per UI-SPEC the lead `<p>` is placed BEFORE any `<Reveal>` wrapper.
- **Missing STANDALONE_PATHS entry:** Adding `src/app/llms.txt/route.ts` without `proxy.ts` + `proxy.test.ts` produces a runtime-only 404 that `bun run build` never catches. This has bitten the project three times already (clientportal, checkin, subscription — see project memory).
- **Partial hreflang rollout:** Shipping the Laval page or expanded FAQ in only 1–3 locales then adding hreflang tags is invalid. Either ship all 4 locale variants simultaneously, or emit NO hreflang until all 4 are ready (D per STATE.md blockers).
- **Hardcoded NAP in llms.txt:** The llms.txt content MUST read from `site.ts` constants, not hardcoded strings. The `site.test.ts` NAP guard will catch violations but avoid the violation entirely.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON-LD for FAQPage | Custom schema object literal | `faqPageGraph(items)` from `src/lib/seo.ts` | Builder already tested; handles `@context`, `@type`, `mainEntity` shape |
| JSON-LD for Service | Custom schema object | `serviceGraph(lang, {...})` from `src/lib/seo.ts` | Already wired on service pages; handles `AggregateOffer`, `areaServed` |
| hreflang / canonical meta | Manual `<link>` tags | `pageMetadata(lang, route, {...})` | Already handles `alternates.canonical`, `alternates.languages`, `x-default` via `languageAlternates()` |
| XSS-safe JSON-LD embedding | Custom serializer | `<JsonLd data={...} />` | Phase 1 FOUND-01: already escapes `<` → `<` before `dangerouslySetInnerHTML` |
| Dictionary loader | Dynamic import logic | `getDictionary(locale)` in `src/app/[lang]/dictionaries.ts` | Server-only; already typed via `Dictionary = typeof en` |
| RTL text direction | `lang === "ar"` conditionals | `dirFor(lang)` from `src/lib/i18n.ts` | Returns `"rtl" | "ltr"` — single canonical check |
| Locale guard | Custom `typeof locale` check | `isLocale(value)` from `src/lib/i18n.ts` | Type predicate already used on every page |

**Key insight:** This phase is entirely wiring existing infrastructure, not building new infrastructure. The planner should have zero tasks that involve writing new helper functions.

---

## Common Pitfalls

### Pitfall 1: STANDALONE_PATHS Missing Entry (Highest Risk)

**What goes wrong:** `/llms.txt` returns a 302 locale redirect (e.g. `→ /fr/llms.txt`) instead of the text file, because the proxy middleware intercepts it before the route handler.

**Why it happens:** `src/proxy.ts` redirects any path without a locale prefix to `/{locale}{path}`. `STANDALONE_PATHS` is the exemption list. Adding the route handler to `src/app/llms.txt/route.ts` does NOT automatically exempt it. The check is `STANDALONE_PATHS.has(pathname)` before the locale redirect runs.

**How to avoid:** Add `"/llms.txt"` to `STANDALONE_PATHS` in `src/proxy.ts` AND add a failing-then-passing test in `src/proxy.test.ts` in the same commit as the route handler. The test is the merge gate.

**Warning signs:** `curl https://onglessanssouci.com/llms.txt` returns `Location: /fr/llms.txt` header instead of `Content-Type: text/plain`. Also caught by the proxy test in CI.

### Pitfall 2: Hreflang Reciprocity Violation

**What goes wrong:** Partial locale rollout (e.g. shipping `/en/laval` and `/fr/laval` with hreflang before `/es/laval` and `/ar/laval` exist) causes Google to invalidate the entire hreflang cluster — all pages lose locale signals.

**Why it happens:** Google requires every alternate URL listed in `hreflang` to include a reciprocal link back to all other alternates. A page that references `/ar/laval` but `/ar/laval` returns 404 fails the reciprocity check.

**How to avoid:** Add all 4 locale dictionary entries (en, fr, es, ar) simultaneously. Add `pageMetadata(lang, "/laval", ...)` which calls `languageAlternates("/laval")` — this automatically emits all 4 locales plus `x-default`. The sitemap entry for `/laval` also needs all 4 locales + x-default.

**Warning signs:** `curl /en/laval` returns 200 but `curl /ar/laval` returns 404 — this is the bad state. Never merge partial locale coverage.

### Pitfall 3: Answer-First Paragraph in Reveal Wrapper

**What goes wrong:** Lead paragraph wrapped in `<Reveal>` gets `opacity: 0` initial CSS state from Framer Motion, making it invisible until JS hydrates. `curl` sees the text but real users don't until hydration.

**Why it happens:** `<Reveal>` applies animation initial state server-side via inline styles. The UI-SPEC is explicit: the lead `<p>` is NOT wrapped in a Reveal component.

**How to avoid:** Place the lead `<p>` as a plain element with no animation wrapper. Styling is `text-lg leading-relaxed text-mocha` — no opacity manipulation.

**Warning signs:** Text appears in `curl` output but is invisible on first paint in the browser.

### Pitfall 4: Schema Text Drift from Visible Copy

**What goes wrong:** A future editor updates `dict.faq.items[n].a` but forgets that the same array feeds `faqPageGraph()`. Or worse — FAQPage schema is written separately from the visible FAQ text.

**Why it happens:** The single-source pattern is a convention, not enforced by TypeScript. If anyone passes a different array to `faqPageGraph()` than is passed to `<Accordion>`, SCHEMA-02 silently fails.

**How to avoid:** Always pass the exact same variable to both. In `faq/page.tsx`: `faqPageGraph(dict.faq.items)` AND `<Accordion items={dict.faq.items} />`. The planner must never introduce a separate `faqSchema` array.

**Warning signs:** `curl /en/faq | grep acceptedAnswer` returns different text than what renders in the browser.

### Pitfall 5: home page missing servicesGraph

**What goes wrong:** SCHEMA-01 requires home to emit expected JSON-LD. The home `page.tsx` currently has NO `<JsonLd>` calls — it relies entirely on `layout.tsx` which emits `organizationGraph`. The layout does NOT emit `servicesGraph`. So home is missing an `ItemList` of services.

**Why it happens:** The home page was built before the schema audit. `organizationGraph` lives in `layout.tsx` (sitewide) but `servicesGraph` is page-specific and must be called from `page.tsx`.

**How to avoid:** Add `<JsonLd data={servicesGraph(lang, items)} />` to the home `page.tsx` alongside the existing services rendering. The `items` array is already constructed there for the UI card grid.

---

## Code Examples

### Verified: faqPageGraph signature

```typescript
// Source: src/lib/seo.ts line 248
export function faqPageGraph(items: readonly { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
```

### Verified: languageAlternates already adds x-default

```typescript
// Source: src/lib/seo.ts lines 38-44
function languageAlternates(route: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of locales) map[locale] = `/${locale}${route}`;
  map["x-default"] = `/${defaultLocale}${route}`; // defaultLocale = "fr"
  return map;
}
// This is called by pageMetadata() for all shared-path routes.
// sitemap.ts does NOT use this helper — it builds its own maps without x-default.
```

### Verified: STANDALONE_PATHS current shape

```typescript
// Source: src/proxy.ts lines 13-18
const STANDALONE_PATHS = new Set([
  "/checkin",
  "/queue",
  "/clientportal",
  "/subscription",
  // "/llms.txt" — MISSING, must be added
]);
```

### Verified: proxy test assertion pattern

```typescript
// Source: src/proxy.test.ts lines 10-15
it("does not locale-prefix /clientportal (T1: route reachable un-prefixed)", async () => {
  const res = await proxy(req("/clientportal"));
  expect(res.headers.get("location")).toBeNull();
});
// Copy this shape exactly for llms.txt assertion
```

### Verified: current dictionary faq structure

```json
// Source: src/dictionaries/en.json (confirmed via inspection)
{
  "faq": {
    "title": "...",
    "intro": "...",
    "items": [
      { "q": "Where is Sans Souci Ongles & Spa located?", "a": "We're inside CF Carrefour Laval..." },
      // ... 11 items currently (target: 15)
    ]
  }
}
```

### Verified: serviceDetails faq data exists in all services

```
// Source: src/dictionaries/en.json (confirmed via inspection)
serviceDetails.manicure.faq:      4 items
serviceDetails.pedicure.faq:      4 items
serviceDetails.lash-extensions.faq: 4 items
serviceDetails.waxing.faq:        4 items
// All 4 services have faq arrays. faqPageGraph(d.faq) will work immediately.
```

### Verified: force-static route handler pattern (Next.js 16)

```typescript
// Source: node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
// Route Handlers are not cached by default. opt into caching for GET via:
export const dynamic = "force-static";

export async function GET() {
  return new Response("...", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
// File path: src/app/llms.txt/route.ts → served at /llms.txt
```

### Verified: sitemap alternates.languages supports x-default key

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md
// alternates.languages is Record<string, string> — "x-default" is a valid key.
// Confirmed: the MetadataRoute.Sitemap type allows any string key in languages.
alternates: {
  languages: {
    es: "https://acme.com/es",
    de: "https://acme.com/de",
    // "x-default": "https://acme.com/fr"  ← valid, add this
  },
},
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API Routes (`pages/api/`) | Route Handlers (`app/*/route.ts`) | Next.js App Router | `/llms.txt` must be a route handler, not an API route |
| `pages/` directory | `app/` directory | Next.js 13+ | All new routes go under `src/app/` |
| `getStaticProps` / `getServerSideProps` | Server Components + `async` page functions | Next.js 13+ | Page data loading is now `await params` + `await getDictionary(lang)` |

**Deprecated/outdated patterns (DO NOT USE):**
- `getStaticProps` — not available in App Router; use `async` Server Components
- `getServerSideProps` — same; data fetching is now inline in the component
- `pages/api/llms.txt.ts` — project uses `app/` directory only; route handlers go in `app/*/route.ts`
- `next-intl` / `next-i18next` — project uses a custom lightweight dictionary system; do not introduce i18n libraries

---

## Per-Route Schema Audit (Current State)

The planner needs this map to know exactly what is missing vs. already wired.

| Route | organizationGraph | servicesGraph | serviceGraph | faqPageGraph | breadcrumbGraph | Notes |
|-------|:-----------------:|:-------------:|:------------:|:------------:|:---------------:|-------|
| `/[lang]/` (home) | layout.tsx ✓ | MISSING | — | — | MISSING | Add servicesGraph to page.tsx; add breadcrumb optional |
| `/[lang]/services` | layout.tsx ✓ | ✓ page.tsx | — | MISSING | ✓ | Add faqPageGraph if service-index FAQ added to dict |
| `/[lang]/services/[slug]` | layout.tsx ✓ | — | ✓ page.tsx | MISSING | ✓ | Add faqPageGraph(d.faq) — data already exists |
| `/[lang]/faq` | layout.tsx ✓ | — | — | ✓ page.tsx | ✓ | Expand items; add lead paragraph |
| `/[lang]/about` | layout.tsx ✓ | — | — | — | ✓ | Add lead paragraph only |
| `/[lang]/laval` | layout.tsx ✓ | — | — | MISSING (new) | MISSING (new) | New page — add all page-level schema |
| `/[lang]/reviews` | layout.tsx ✓ | — | — | — | — | Out of scope (D-04) |
| `/[lang]/gallery` | layout.tsx ✓ | — | — | — | — | Out of scope (D-04) |

**Answer-first lead paragraph coverage needed:**
- `/[lang]/` (home) — add `dict.home.lead` key + `<p>` rendering
- `/[lang]/services` — add `dict.servicesPage.lead` key + `<p>` rendering
- `/[lang]/services/[slug]` — add `dict.serviceDetails[id].lead` key + `<p>` rendering (4 services × 4 locales = 16 strings)
- `/[lang]/faq` — add `dict.faq.lead` key + `<p>` rendering
- `/[lang]/about` — add `dict.about.lead` key + `<p>` rendering
- `/[lang]/laval` — `dict.laval.lead` (new page, included in new section)

---

## Verification Protocol (SSR Curl Tests)

All success criteria are verified via `curl` of raw HTML. Run locally with `bun run build && bun run start`.

```bash
# SCHEMA-01: FAQPage on FAQ hub
curl http://localhost:3000/en/faq | grep '"@type":"FAQPage"'
curl http://localhost:3000/en/faq | grep acceptedAnswer | wc -l  # must be ≥5

# SCHEMA-01: Service + FAQPage on service page
curl http://localhost:3000/en/services/nail-care | grep '"@type":"FAQPage"'
curl http://localhost:3000/en/services/nail-care | grep '"@type":"Service"'

# SCHEMA-01: FAQPage on Laval page
curl http://localhost:3000/en/laval | grep '"@type":"FAQPage"'

# CONTENT-01: Answer-first lead present in SSR HTML
curl http://localhost:3000/en/ | grep -o '.\{0,80\}dict.home.lead.\{0,20\}'
# (replace with actual first ~20 chars of the lead text)

# CONTENT-03: Laval page renders
curl http://localhost:3000/en/laval | grep -i 'carrefour'

# CRAWL-01: llms.txt returns plain text, no redirect
curl -v http://localhost:3000/llms.txt 2>&1 | grep 'Content-Type\|location\|< HTTP'
curl http://localhost:3000/llms.txt | grep 'Sans Souci'

# CRAWL-02: Sitemap includes x-default and laval
curl http://localhost:3000/sitemap.xml | grep 'x-default'
curl http://localhost:3000/sitemap.xml | grep 'laval'

# Proxy test (automated):
bun run test src/proxy.test.ts
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| bun | `bun run build`, `bun run test` | ✓ (project standard) | (project lockfile) | `npm run` |
| Next.js 16 | All routing / SSR | ✓ 16.2.6 | 16.2.6 | — |
| Vitest | `bun run test` | ✓ (vitest.config.ts present) | (project) | — |
| `src/app/` directory structure | All new routes | ✓ | — | — |

No environment blockers. All dependencies are already installed.

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`, `security_block_on: high`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth on any new route |
| V3 Session Management | No | No sessions on new routes |
| V4 Access Control | No | All new routes are public |
| V5 Input Validation | Yes (minimal) | `isLocale(lang)` guard on every page (already pattern) |
| V6 Cryptography | No | No crypto in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JSON-LD script injection | Tampering | `JsonLd.tsx` already escapes `<` → `<` (FOUND-01) — do not bypass |
| NAP hardcode in llms.txt | Information Disclosure (stale) | Import from `site.ts` — never hardcode NAP strings |
| Unvalidated locale param | Tampering | `isLocale(lang)` + `notFound()` pattern — already on every page, replicate on `/laval` |

No new security surface beyond the existing patterns. The `llms.txt` route is public and serves static text — no auth, no user input, no database queries.

---

## Open Questions

1. **Services-index FAQPage schema**
   - What we know: `servicesPage` in the dictionary has `heading` and `intro` but no `faq` key. The audit shows `faqPageGraph` is MISSING on the services index.
   - What's unclear: Does the services index page need a FAQPage schema? SCHEMA-01 says "every key route" — services index is a key route, but there are no FAQ items for it in the dictionary.
   - Recommendation: Skip `faqPageGraph` on services index (no source data exists); focus on `servicesGraph` + `breadcrumbGraph` already present there. Add a `dict.servicesPage.lead` key for CONTENT-01 only.

2. **home page breadcrumb**
   - What we know: The home page has no `breadcrumbGraph` and no `<JsonLd>` calls. Layout provides `organizationGraph`.
   - What's unclear: Should home emit a `BreadcrumbList`? It's technically a single-node breadcrumb (just "Home") which has no navigation value.
   - Recommendation: Skip breadcrumb on home. Add `servicesGraph` and the lead paragraph — that satisfies SCHEMA-01 for home.

3. **Dict key for per-service lead paragraphs**
   - What we know: `serviceDetails[id]` currently has: `title`, `heroAlt`, `intro` (array of paragraphs), `whyUs`, `included`, `addons`, `duration`, `aftercare`, `hygiene`, `faq`, `metaTitle`, `metaDescription`.
   - What's unclear: Should the lead paragraph reuse `intro[0]` (already 40–60 words on some services) or should a new `lead` key be added?
   - Recommendation: Add a new `lead` key per service (separate from `intro`) to guarantee exact 40–60 word control. This allows `intro` paragraphs to be longer without violating CONTENT-01. The planner should spec all 4 services × 4 locales = 16 `lead` strings in the copy-authorship wave.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `bun run test` is the correct test invocation (not `npm test`) | Verification Protocol | Low — `npm run test` also works; both resolve to vitest |
| A2 | The 4 services in `serviceDetails` are `manicure`, `pedicure`, `lash-extensions`, `waxing` — exhaustive | Per-Route Schema Audit | Low — confirmed by dictionary inspection; adding a 5th service is out of scope |
| A3 | Static date constants for `lastModified` are acceptable for CRAWL-02 (vs. git mtime) | Sitemap hygiene pattern | Medium — if the user wants git-mtime accuracy, the approach changes; but static dates are accurate for content-driven changes and simpler |

---

## Sources

### Primary (HIGH confidence — sourced directly from project codebase)

- `src/lib/seo.ts` — all builder signatures, `languageAlternates` x-default behavior, `faqPageGraph` signature
- `src/lib/site.ts` — NAP constants, `nav`, `secondaryNav`, `hours`, `contact`, `geo`
- `src/lib/i18n.ts` — `locales`, `defaultLocale = "fr"`, `isLocale`, `dirFor`, `LangParams`
- `src/lib/dictionary.ts` — `Dictionary = typeof en` type derivation
- `src/proxy.ts` — `STANDALONE_PATHS` current shape, middleware logic
- `src/proxy.test.ts` — exact assertion pattern for STANDALONE_PATHS tests
- `src/app/[lang]/faq/page.tsx` — single-source FAQPage + Accordion pattern
- `src/app/[lang]/services/[slug]/page.tsx` — existing serviceGraph + breadcrumbGraph; confirmed missing faqPageGraph
- `src/app/[lang]/page.tsx` — confirmed: no JsonLd calls, no lead paragraph
- `src/app/[lang]/layout.tsx` — confirmed: organizationGraph wired sitewide here
- `src/app/sitemap.ts` — current shape; confirmed `lastModified = new Date()` and missing x-default
- `src/dictionaries/en.json` — faq.items count (11), serviceDetails faq presence (4 items per service)
- `src/components/JsonLd.tsx` — Phase 1 escaping pattern (FOUND-01)
- `src/components/PageHeader.tsx` — title band, `py-20 md:py-28` spacing
- `.planning/config.json` — `nyquist_validation: false` (Validation Architecture section omitted per config)

### Secondary (HIGH confidence — official project docs)

- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — `force-static` route handler pattern, `export const dynamic = "force-static"`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md` — `MetadataRoute.Sitemap` `alternates.languages` accepts `"x-default"` as a key

---

## Project Constraints (from CLAUDE.md)

1. **AGENTS.md hard rule:** This is Next.js 16.2.6 — breaking changes from training data. Read `node_modules/next/dist/docs/` before relying on memory. Relevant paths surfaced: `01-app/01-getting-started/15-route-handlers.md`, `01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`.
2. **No new top-level directories** (STATE.md brownfield constraint). New routes go inside existing `src/app/` tree.
3. **`bun run` preferred** over `npm run` (global CLAUDE.md). Use `bun run test`, `bun run build`.
4. **Immutability:** All JS/TS must follow immutable patterns (spread over mutation). Dictionary JSON extension = new keys added, existing keys unchanged.
5. **No mutation of `site.ts` NAP literals** in application code — import from `site.ts` only. `site.test.ts` NAP guard enforces this at test time.
6. **Files ≤ 800 lines, functions ≤ 50 lines** (coding style). New page files should follow the existing ~50-line page pattern.
7. **Security:** `isLocale(lang)` guard + `notFound()` on every new localized page (already the pattern — replicate exactly on `/laval`).
8. **No shadcn** — project does not use shadcn. Components are custom in `src/components/` only (confirmed by UI-SPEC: `shadcn_initialized: false`).

---

## Metadata

**Confidence breakdown:**
- Existing code gaps/patterns: HIGH — read directly from source files
- JSON-LD builder signatures: HIGH — read from `src/lib/seo.ts`
- STANDALONE_PATHS coupling: HIGH — read from `src/proxy.ts` + `src/proxy.test.ts` + project memory
- Next.js 16 route handler / sitemap API: HIGH — read from `node_modules/next/dist/docs/`
- x-default in sitemap: HIGH — confirmed via Next.js 16 docs (alternates.languages is `Record<string, string>`)
- Dictionary shape for new keys: HIGH — TypeScript `Dictionary = typeof en` enforces shape at compile time

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (stable codebase; content/dictionary decisions may evolve with user copy review)
