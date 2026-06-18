# Phase 2: Content, Schema & Crawl Surface — Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 12 new/modified files
**Analogs found:** 12 / 12 (all files have in-repo analogs)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/[lang]/laval/page.tsx` | page (Server Component) | request-response | `src/app/[lang]/faq/page.tsx` | exact |
| `src/app/llms.txt/route.ts` | route handler | request-response (static) | `src/app/api/contact/route.ts` | role-match (different: force-static, GET, text/plain) |
| `src/app/[lang]/faq/page.tsx` (modify) | page (Server Component) | request-response | self — existing file | self-extension |
| `src/app/[lang]/page.tsx` (modify) | page (Server Component) | request-response | `src/app/[lang]/about/page.tsx` | exact |
| `src/app/[lang]/about/page.tsx` (modify) | page (Server Component) | request-response | self — existing file | self-extension |
| `src/app/[lang]/services/page.tsx` (modify) | page (Server Component) | request-response | self — existing file | self-extension |
| `src/app/[lang]/services/[slug]/page.tsx` (modify) | page (Server Component) | request-response | self — existing file | self-extension |
| `src/app/sitemap.ts` (modify) | sitemap route | batch/transform | self — existing file | self-extension |
| `src/proxy.ts` (modify) | middleware | request-response | self — existing file | self-extension |
| `src/proxy.test.ts` (modify) | test | — | self — existing file | self-extension |
| `src/dictionaries/{en,fr,es,ar}.json` (modify) | content/config | — | self — existing files | self-extension |
| `src/lib/dictionary.ts` (no change needed) | type definition | — | self | no-op if `Dictionary = typeof en` is structural |

---

## Pattern Assignments

### `src/app/[lang]/laval/page.tsx` (NEW page, request-response)

**Analog:** `src/app/[lang]/faq/page.tsx` — exact structural match (locale guard, dict load, JsonLd + breadcrumb + PageHeader + Accordion)

**Imports pattern** (from `faq/page.tsx` lines 1-9 — adapt for laval):
```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Accordion } from "@/components/Accordion";
import { getDictionary } from "../dictionaries";
import { isLocale, dirFor, type LangParams } from "@/lib/i18n";
import { pageMetadata, faqPageGraph, breadcrumbGraph } from "@/lib/seo";
```

**generateMetadata pattern** (from `faq/page.tsx` lines 11-21 — adapt route to "/laval"):
```typescript
export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/laval", {
    title: dict.laval.metaTitle,
    description: dict.laval.metaDescription,
  });
  // pageMetadata("/laval") calls languageAlternates("/laval") internally,
  // which emits en/fr/es/ar + x-default automatically. No routeByLocale needed
  // because the slug is identical across all locales (D-05).
}
```

**Core page pattern** (from `faq/page.tsx` lines 23-42 — adapt for laval content):
```typescript
export default async function LavalPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      {/* Answer-first lead — MUST be first readable element in SSR HTML (CONTENT-01) */}
      {/* NOT wrapped in <Reveal> — must be visible before JS hydration (UI-SPEC) */}
      <p
        className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
        dir={dirFor(lang)}
      >
        {dict.laval.lead}
      </p>

      {/* Schema before visible content — JsonLd is a Server Component, order doesn't affect SSR */}
      <JsonLd data={faqPageGraph(dict.laval.faq)} />
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "" },
          { name: dict.laval.title, route: "/laval" },
        ])}
      />

      <PageHeader title={dict.laval.title} intro={dict.laval.intro} />

      {/* Location facts section */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        {/* location/parking/transit/landmark content from dict.laval.* */}
      </section>

      {/* FAQ — SAME array fed to both faqPageGraph() and <Accordion> (SCHEMA-02) */}
      <section className="bg-fog">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <Accordion items={dict.laval.faq} />
        </div>
      </section>
    </>
  );
}
```

**Critical constraint:** `dict.laval.faq` must be passed to BOTH `faqPageGraph(dict.laval.faq)` and `<Accordion items={dict.laval.faq} />` — never separate arrays. This is the SCHEMA-02 single-source invariant proven by `faq/page.tsx`.

---

### `src/app/llms.txt/route.ts` (NEW route handler, static GET)

**Analog:** `src/app/api/contact/route.ts` for route-handler file structure. The `force-static` + `text/plain` + GET-only pattern has no in-repo analog — use Next.js 16 docs pattern (confirmed in RESEARCH.md from `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`).

**Full file pattern** (no analog for force-static in repo — shape from docs + contact route structure):
```typescript
// src/app/llms.txt/route.ts
// force-static: Next.js builds this to a static file at build time.
// No runtime cost; served directly by CDN/Next.js static file handler.
export const dynamic = "force-static";

import { site } from "@/lib/site";
import { services } from "@/lib/services";

export function GET() {
  const body = buildLlmsTxt();
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function buildLlmsTxt(): string {
  // All content sourced from site.ts — NEVER hardcode NAP strings.
  // site.test.ts NAP guard will catch violations but avoid them entirely.
  const serviceNames = services.map((s) => s.id).join(", ");
  return [
    `# ${site.name}`,
    ``,
    `## About`,
    `${site.name} is a nail salon and spa located at ${site.address.street}, ${site.address.city}.`,
    // ... rest of business brief: hours, booking, key-page links
    // fr/es/ar variants exist at /{locale}/...
  ].join("\n");
}
```

**MANDATORY two-step after creating this file** (from `src/proxy.ts` lines 13-18 + `src/proxy.test.ts`):

Step 1 — `src/proxy.ts` STANDALONE_PATHS (lines 13-18):
```typescript
const STANDALONE_PATHS = new Set([
  "/checkin",
  "/queue",
  "/clientportal",
  "/subscription",
  "/llms.txt",   // ADD — without this, proxy redirects to /fr/llms.txt at runtime
]);
```

Step 2 — `src/proxy.test.ts` new assertion (copy exact shape from lines 10-15):
```typescript
it("does not locale-prefix /llms.txt (T: route reachable un-prefixed)", async () => {
  const res = await proxy(req("/llms.txt"));
  // NextResponse.next() has no Location header; locale redirect would set one.
  expect(res.headers.get("location")).toBeNull();
});
```

Both steps must be in the same commit as the route handler. This is the hard merge gate.

---

### `src/app/[lang]/faq/page.tsx` (MODIFY — add lead paragraph)

**Self-extension.** Current file (lines 23-42) has no lead paragraph. Add it as the first element inside `<>`, before the existing `<JsonLd>` blocks.

**Lead paragraph insertion** (insert before line 29, current `<JsonLd data={faqPageGraph...}>`):
```typescript
// ADD before existing <JsonLd> blocks:
<p
  className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
  dir={dirFor(lang)}
>
  {dict.faq.lead}
</p>
```

Also add `dirFor` to the existing import on line 4:
```typescript
import { isLocale, dirFor, type LangParams } from "@/lib/i18n";
```

Dictionary key to add: `dict.faq.lead` (string, 40-60 words, in all 4 locales).

**No other changes to this file.** The existing `faqPageGraph(dict.faq.items)` + `<Accordion items={dict.faq.items}>` single-source pattern is already correct. FAQ expansion is purely a dictionary content change.

---

### `src/app/[lang]/page.tsx` (MODIFY — add lead paragraph + servicesGraph JsonLd)

**Current state:** Lines 1-253. No `<JsonLd>` calls anywhere in the file. Imports `pageMetadata` from `@/lib/seo` (line 14) but no schema builders.

**Two additions needed:**

1. Add `servicesGraph` to imports and emit as `<JsonLd>`:
```typescript
// MODIFY line 14 — add servicesGraph:
import { pageMetadata, servicesGraph } from "@/lib/seo";

// ADD inside return <>, before the first <section> (line 52):
// items array is already constructed later for the services card grid (lines 42-47)
// Reconstruct it early or hoist it — follow services/page.tsx lines 34-40 pattern:
const schemaItems = services.map((s) => ({
  name: dict.serviceDetails[s.id].title,
  description: dict.serviceDetails[s.id].metaDescription,
  price: services_registry[i].price,   // use the services registry import
  priceTo: services_registry[i].priceTo,
  path: servicePath(s, lang),
}));
// Then in JSX:
<JsonLd data={servicesGraph(lang, schemaItems)} />
```

2. Add lead paragraph as first readable element (before the hero `<section>` at line 52):
```typescript
// ADD before first <section>:
<p
  className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
  dir={dirFor(lang)}
>
  {dict.home.lead}
</p>
```

Also add missing imports:
```typescript
import { dirFor } from "@/lib/i18n";    // add dirFor (isLocale already imported)
import { JsonLd } from "@/components/JsonLd";
import { servicePath } from "@/lib/services";  // already imported via services
```

**Analog for servicesGraph call site:** `src/app/[lang]/services/page.tsx` lines 34-44 — exact same pattern for building `items` and passing to `<JsonLd data={servicesGraph(lang, items)} />`.

---

### `src/app/[lang]/about/page.tsx` (MODIFY — add lead paragraph only)

**Self-extension.** Current file (lines 23-54). Add `dirFor` import and lead paragraph before `<JsonLd>` on line 30.

**Minimal diff:**
```typescript
// MODIFY line 8 — add dirFor:
import { isLocale, dirFor, type LangParams } from "@/lib/i18n";

// ADD inside return <>, before existing <JsonLd data={breadcrumbGraph...}> (line 30):
<p
  className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
  dir={dirFor(lang)}
>
  {dict.about.lead}
</p>
```

Dictionary key to add: `dict.about.lead` (string, 40-60 words, in all 4 locales).

---

### `src/app/[lang]/services/page.tsx` (MODIFY — add lead paragraph)

**Self-extension.** Current file (lines 28-97). Has `servicesGraph` + `breadcrumbGraph` already (lines 44-50). Missing lead paragraph and `dirFor`.

**Minimal diff:**
```typescript
// MODIFY line 13 — add dirFor:
import { isLocale, dirFor, type LangParams } from "@/lib/i18n";

// ADD inside return <>, before existing <JsonLd data={servicesGraph...}> (line 44):
<p
  className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
  dir={dirFor(lang)}
>
  {dict.servicesPage.lead}
</p>
```

Dictionary key to add: `dict.servicesPage.lead` (string, 40-60 words, in all 4 locales).

---

### `src/app/[lang]/services/[slug]/page.tsx` (MODIFY — add faqPageGraph + lead paragraph)

**Self-extension.** Current file (lines 43-250). Has `serviceGraph` + `breadcrumbGraph` (lines 58-73). Missing `faqPageGraph` and lead paragraph. The `d.faq` array already exists (verified: 4 items per service in all 4 locales).

**Two additions:**

1. Add `faqPageGraph` import and JsonLd call (after existing breadcrumbGraph block, line 73):
```typescript
// MODIFY line 17 — add faqPageGraph:
import { pageMetadata, serviceGraph, breadcrumbGraph, faqPageGraph } from "@/lib/seo";

// ADD after the breadcrumbGraph <JsonLd> block (after line 73):
<JsonLd data={faqPageGraph(d.faq)} />
// d = dict.serviceDetails[service.id], already loaded at line 50.
// d.faq is the SAME array rendered visibly in the FAQ <dl> at lines 197-207.
// Single-source invariant: same variable, same array — SCHEMA-02 satisfied.
```

2. Add lead paragraph before the hero `<section>` (before line 76):
```typescript
// ADD before first <section> (line 76):
<p
  className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
  dir={dirFor(lang)}
>
  {d.lead}
</p>
// d.lead is a new key added to serviceDetails[id] in all 4 locale dictionaries.
// dirFor already imported at line 16.
```

Dictionary keys to add: `serviceDetails.manicure.lead`, `serviceDetails.pedicure.lead`, `serviceDetails.lash-extensions.lead`, `serviceDetails.waxing.lead` — in all 4 locales (16 strings total).

---

### `src/app/sitemap.ts` (MODIFY — x-default, lastModified, /laval entry)

**Self-extension.** Current file (lines 1-76). Three changes.

**1. Replace `lastModified = new Date()` (line 11) with static date constants:**
```typescript
// REPLACE line 11:
// const lastModified = new Date();  // REMOVE

// ADD after imports:
const LAST_MODIFIED_NAV = new Date("2026-06-17");
const LAST_MODIFIED_SERVICES = new Date("2026-06-17");
const LAST_MODIFIED_FAQ = new Date("2026-06-17");
const LAST_MODIFIED_LAVAL = new Date("2026-06-17");
// Update these constants when content actually changes — never use new Date().
```

**2. Add `x-default` to every `alternates.languages` map** (current pattern at lines 21-24, replicated 4 times):
```typescript
// BEFORE (current — lines 21-24):
alternates: {
  languages: Object.fromEntries(
    locales.map((l) => [l, `${site.url}/${l}${toPath(item.href)}`]),
  ),
},

// AFTER (add x-default spread, defaultLocale = "fr"):
import { locales, defaultLocale } from "@/lib/i18n";  // add defaultLocale to import

alternates: {
  languages: {
    ...Object.fromEntries(
      locales.map((l) => [l, `${site.url}/${l}${toPath(item.href)}`])
    ),
    "x-default": `${site.url}/${defaultLocale}${toPath(item.href)}`,
  },
},
// Apply the same spread pattern to all 4 entry groups: navEntries, serviceEntries,
// comparisonEntries, secondaryEntries — and to the new laval entry below.
```

**3. Add Laval entry** (new entry group, insert before the `return` on line 70):
```typescript
const lavalEntries: MetadataRoute.Sitemap = locales.map((locale) => ({
  url: `${site.url}/${locale}/laval`,
  lastModified: LAST_MODIFIED_LAVAL,
  changeFrequency: "monthly" as const,
  priority: 0.8,
  alternates: {
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}/laval`])),
      "x-default": `${site.url}/${defaultLocale}/laval`,
    },
  },
}));

// Add to return array:
return [...navEntries, ...secondaryEntries, ...lavalEntries, ...serviceEntries, ...comparisonEntries];
```

---

### `src/dictionaries/{en,fr,es,ar}.json` (MODIFY — new keys)

**Self-extension.** Add new keys; never modify existing keys. TypeScript `Dictionary = typeof en` enforces shape at compile time — adding to `en.json` automatically requires the same keys in fr/es/ar.

**New keys to add (shape — EN values are placeholders for copy-authorship wave):**

```json
// In "faq" object — add "lead" alongside existing "title", "intro", "items":
"faq": {
  "title": "...",
  "intro": "...",
  "lead": "EN: 40-60 word direct answer about the FAQ hub",
  "items": [ ...existing 11 items... + 4 new items to reach ~15 ]
}

// In "home" object — add "lead":
"home": {
  "lead": "EN: 40-60 word direct answer about Sans Souci Ongles & Spa",
  ...existing keys...
}

// In "about" object — add "lead":
"about": {
  "lead": "EN: 40-60 word direct answer about the salon story",
  ...existing keys...
}

// In "servicesPage" object — add "lead":
"servicesPage": {
  "lead": "EN: 40-60 word direct answer about the services offered",
  ...existing keys...
}

// In each "serviceDetails.[id]" object — add "lead":
"serviceDetails": {
  "manicure": {
    "lead": "EN: 40-60 word direct answer about manicure services",
    ...existing keys...
  },
  "pedicure": { "lead": "...", ...existing... },
  "lash-extensions": { "lead": "...", ...existing... },
  "waxing": { "lead": "...", ...existing... }
}

// New top-level "laval" section:
"laval": {
  "metaTitle": "EN: meta title for Laval page",
  "metaDescription": "EN: meta description",
  "title": "EN: page title",
  "intro": "EN: intro for PageHeader",
  "lead": "EN: 40-60 word direct answer about the Laval location",
  "faq": [
    { "q": "Where is Sans Souci in Laval?", "a": "..." },
    { "q": "Is there parking at CF Carrefour Laval?", "a": "..." },
    { "q": "How do I get there by transit?", "a": "..." },
    { "q": "Do you accept walk-ins in Laval?", "a": "..." },
    { "q": "What landmarks are near the salon?", "a": "..." }
  ]
}
```

**Workflow constraint (D-10):** Draft EN values first. All 4 locale files must be updated simultaneously before shipping (hreflang reciprocity — Pitfall 2 in RESEARCH.md).

---

## Shared Patterns

### Locale Guard + Dictionary Load
**Source:** Every `[lang]` page — `faq/page.tsx` lines 23-26, `about/page.tsx` lines 23-26, `services/[slug]/page.tsx` lines 43-50
**Apply to:** `laval/page.tsx` (new page)
```typescript
const { lang } = await params;
if (!isLocale(lang)) notFound();
const dict = await getDictionary(lang);
```

### Answer-First Lead Paragraph
**Source:** Pattern defined in RESEARCH.md + UI-SPEC (no existing in-repo example yet — this phase is first)
**Apply to:** home, faq, about, services index, each service slug, laval
**Styling contract (from UI-SPEC):**
```typescript
<p
  className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
  dir={dirFor(lang)}
>
  {dict.[page].lead}
</p>
```
**Placement rule:** First element inside `<>` fragment. Before any `<JsonLd>`, before any `<section>`, before `<PageHeader>`. Never inside `<Reveal>` (would get `opacity: 0` initial state from Framer Motion — Pitfall 3 in RESEARCH.md).

### JsonLd Emission
**Source:** `src/app/[lang]/faq/page.tsx` lines 29-35, `src/app/[lang]/services/[slug]/page.tsx` lines 58-73
**Apply to:** All pages emitting schema
```typescript
<JsonLd data={faqPageGraph(dict.faq.items)} />
<JsonLd data={breadcrumbGraph(lang, [
  { name: dict.nav.home, route: "" },
  { name: dict.nav.faq, route: "/faq" },
])} />
```
`JsonLd` is a Server Component in `src/components/JsonLd.tsx`. Already escapes `<` → `<` before `dangerouslySetInnerHTML` (Phase 1 FOUND-01). Use as-is; never bypass or duplicate.

### Single-Source Schema/Copy Invariant (SCHEMA-02)
**Source:** `src/app/[lang]/faq/page.tsx` — `faqPageGraph(dict.faq.items)` AND `<Accordion items={dict.faq.items} />` use the exact same variable
**Apply to:** laval page FAQ, any future FAQPage emission
**Rule:** The variable passed to `faqPageGraph()` must be the identical reference passed to the visible render component (`<Accordion>` or `<dl>` loop). Never construct a separate array for schema.

### STANDALONE_PATHS Coupling
**Source:** `src/proxy.ts` lines 13-18 + `src/proxy.test.ts` lines 10-15
**Apply to:** `llms.txt` route handler only (laval is a localized `[lang]` route — does NOT need STANDALONE_PATHS per D-05)
**The test shape to copy exactly** (`proxy.test.ts` lines 10-14):
```typescript
it("does not locale-prefix /llms.txt (T: route reachable un-prefixed)", async () => {
  const res = await proxy(req("/llms.txt"));
  expect(res.headers.get("location")).toBeNull();
});
```

---

## No Analog Found

No files in this phase are without an in-repo analog. All patterns are fully covered by existing code.

| File | Analog Gap | Resolution |
|------|-----------|------------|
| `src/app/llms.txt/route.ts` | No `force-static` GET handler exists in repo (all existing route handlers are POST/auth, not static text) | Use Next.js 16 docs pattern (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`) + import/export structure from `contact/route.ts` |

---

## Metadata

**Analog search scope:** `src/app/[lang]/`, `src/app/api/`, `src/app/sitemap.ts`, `src/proxy.ts`, `src/proxy.test.ts`
**Files scanned:** 9 source files read directly
**Pattern extraction date:** 2026-06-17

**Key invariants for planner:**
- `faqPageGraph(x)` and the visible FAQ render component must always receive the same variable `x` — never diverge (SCHEMA-02)
- Lead `<p>` is never wrapped in `<Reveal>` — plain element, first in fragment
- `llms.txt` proxy entry + test = same commit as route handler, no exceptions
- All 4 locale dictionaries ship simultaneously for any new page or expanded FAQ section
- `pageMetadata(lang, "/laval", {...})` handles hreflang automatically via `languageAlternates("/laval")` — no manual `<link>` tags
