# Phase 05: Agent-Readable Surface (`.md` twins) — Pattern Map

**Mapped:** 2026-06-23
**Files analyzed:** 7 (new/modified)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/md-serializer.ts` | utility | transform | `src/lib/services.ts` (pure named exports, no server-only) | role-match |
| `src/lib/md-routes.ts` | utility | transform | `src/app/sitemap.ts` (registry enumeration → path list) | exact |
| `src/lib/page-dates.ts` | config | — | `src/app/sitemap.ts` lines 16–43 (`PAGE_DATES` block) | exact (extraction) |
| `src/app/[lang].md/route.ts` + `src/app/[lang]/*/route.ts` (×13) | route handler | request-response | `src/app/llms.txt/route.ts` (force-static, `new Response()`) | exact |
| `src/app/[lang]/services/[slug].md/route.ts` (+ comparisons, guides slug variants) | route handler | request-response | `src/app/llms.txt/route.ts` + `src/lib/services.ts` `slugParams`/`serviceBySlug` | exact |
| `src/md-coverage.test.ts` | test | — | `src/proxy.test.ts` + `src/app/llms.txt/route.test.ts` | role-match |
| `src/proxy.test.ts` (addition) | test | — | `src/proxy.test.ts` existing passthrough assertion pattern | exact |
| `src/app/llms.txt/route.ts` (addition) | route handler | request-response | self (`comparisonLabels`/`guideLabels` Records pattern) | exact |

---

## Pattern Assignments

### `src/lib/md-serializer.ts` (utility, transform)

**Analog:** `src/lib/services.ts` and `src/lib/comparisons.ts`

**Convention:** Pure module — no `"server-only"`, no default export, named exports only, `import type` for type-only dependencies. Files in `src/lib/` that are utility/data never carry `"server-only"` so they remain importable from Vitest tests.

**Imports pattern** (`src/lib/services.ts` lines 1–9, `src/lib/comparisons.ts` lines 1–7):
```typescript
// src/lib/md-serializer.ts
// NO "server-only" — must be importable from tests (Pitfall 3 from RESEARCH.md)
import type { Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import type { Service } from "@/lib/services";
import type { Comparison } from "@/lib/comparisons";
import type { Guide } from "@/lib/guides";
import { site } from "@/lib/site";
```

**Named export pattern** (`src/lib/services.ts` lines 25–87):
```typescript
// All exports are named; no default export.
// Types are exported alongside their consumers.
export type Block = { kind: "p" | "h3" | "ul"; text: string; items: string[] };

export function frontmatter(opts: { title: string; lang: string; canonical: string; updated: string }): string { ... }
export function renderBlocks(blocks: readonly Block[]): string { ... }
export function renderComparisonTable(columns: readonly string[], rows: readonly { label: string; cells: readonly string[] }[]): string { ... }
export function renderHomeMd(...): string { ... }
// one renderXxxMd() per route family
```

**Immutability pattern** (`src/lib/services.ts` line 25, `src/lib/comparisons.ts` line 27):
```typescript
// Arrays declared as const + readonly — never mutated.
export const services: readonly Service[] = [ ... ] as const;
// Same discipline for any lookup Records in md-serializer:
const PAGE_DATES: Record<string, string> = { ... }; // imported from page-dates.ts
```

---

### `src/lib/md-routes.ts` (utility, transform)

**Analog:** `src/app/sitemap.ts`

**Convention:** Mirrors the sitemap's route enumeration exactly — same registry imports, same `locales.flatMap()` structure, same `toPath()` helper for `/` → `""`. Returns plain path strings instead of sitemap objects. Pure function, no `"server-only"`.

**Imports pattern** (`src/app/sitemap.ts` lines 1–7):
```typescript
import { locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import { services, servicePath } from "@/lib/services";
import { comparisons, comparisonPath } from "@/lib/comparisons";
import { guides, guidePath } from "@/lib/guides";
```

**Route enumeration pattern** (`src/app/sitemap.ts` lines 50–68, 69–84, 86–105, 107–123):
```typescript
// Copy this structure from sitemap.ts — iterate same registries in same order.
// sitemap.ts builds MetadataRoute.Sitemap entries; md-routes.ts builds path strings.

const toPath = (href: string) => (href === "/" ? "" : href);

// nav routes
const navPaths: string[] = locales.flatMap((locale) =>
  site.nav.map((item) => `/${locale}${toPath(item.href)}`)
);
// service slug routes
const servicePaths: string[] = locales.flatMap((locale) =>
  services.map((s) => `/${locale}${servicePath(s, locale)}`)
);
// comparison slug routes
const comparisonPaths: string[] = locales.flatMap((locale) =>
  comparisons.map((c) => `/${locale}${comparisonPath(c, locale)}`)
);
// guide slug routes
const guidePaths: string[] = locales.flatMap((locale) =>
  guides.map((g) => `/${locale}${guidePath(g, locale)}`)
);
// secondaryNav + localPaths — same pattern, mirror sitemap.ts lines 125–158

export function allMdPaths(): string[] {
  // return the combined array of all locale-prefixed paths (without .md suffix)
  // The test appends ".md" when checking: mdPaths.has(sitemapPath + ".md")
  return [...navPaths, ...secondaryPaths, ...localPaths, ...servicePaths, ...comparisonPaths, ...guidePaths];
}
```

---

### `src/lib/page-dates.ts` (config)

**Analog:** `src/app/sitemap.ts` lines 16–47 (the `PAGE_DATES` block, extracted verbatim)

**Convention:** Extract the `PAGE_DATES` Record and `FALLBACK_DATE` constant out of `sitemap.ts` into this thin shared module. Both `sitemap.ts` and the `.md` route handlers import from here. No `"server-only"` (pure data).

**Pattern to copy** (`src/app/sitemap.ts` lines 16–47):
```typescript
// src/lib/page-dates.ts — extracted verbatim from sitemap.ts lines 16-47
// After extraction, sitemap.ts replaces its local block with:
//   import { PAGE_DATES, FALLBACK_DATE, pageDate } from "@/lib/page-dates";

export const PAGE_DATES: Record<string, string> = {
  "/": "2026-06-17",
  "/services": "2026-06-17",
  "/about": "2026-06-01",
  // ... (copy all entries from sitemap.ts lines 18-39, convert Date to ISO string)
};

export const FALLBACK_DATE = "2026-06-01";

export function pageDate(path: string): string {
  return PAGE_DATES[path] ?? FALLBACK_DATE;
}
```

Note: `sitemap.ts` uses `new Date("2026-06-17")` for `lastModified` (requires `Date`). The `.md`
serializer needs the date as a `string` for frontmatter (`updated: 2026-06-17`). Export strings from
`page-dates.ts`; `sitemap.ts` can wrap with `new Date()` locally, or `page-dates.ts` can export both
forms. Planner to decide; the key invariant is one source of truth for the date values.

---

### Force-static nav route handlers (×11): `src/app/[lang].md/route.ts`, `src/app/[lang]/about.md/route.ts`, etc. (route handler, request-response)

**Analog:** `src/app/llms.txt/route.ts` (entire file, 107 lines)

**The three conventions from the analog to copy exactly:**

**1. `force-static` declaration** (`src/app/llms.txt/route.ts` line 12):
```typescript
export const dynamic = "force-static";
```
Place this as the first export after imports. Every `.md` route handler must have it.

**2. `GET` function signature returning `Response`** (`src/app/llms.txt/route.ts` lines 47–106):
```typescript
// llms.txt: no params (not a dynamic route)
export function GET(): Response {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// .md nav routes: async, awaits params, returns Promise<Response>
// (Next.js 16: params is a Promise — always await it)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string }> }
): Promise<Response> {
  const { lang } = await params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });
  const dict = await getDictionary(lang);
  const body = renderAboutMd(lang, dict, `${site.url}/${lang}/about`);
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
```

Content-Type difference: `llms.txt` uses `text/plain; charset=utf-8`; `.md` routes use `text/markdown; charset=utf-8` (RFC 7763).

**3. `generateStaticParams` for nav routes** (four locales only, no slug dimension):
```typescript
// For [lang].md/route.ts and [lang]/about.md/route.ts etc.
export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }, { lang: "es" }, { lang: "ar" }];
}
// Or equivalently: return locales.map((lang) => ({ lang }));
// (locales from "@/lib/i18n")
```

**Imports pattern for nav route handlers**:
```typescript
import "server-only";
import { getDictionary } from "../dictionaries";   // adjust relative depth per folder
import { site } from "@/lib/site";
import { isLocale } from "@/lib/i18n";
import { renderAboutMd } from "@/lib/md-serializer"; // one named import per route family
import { pageDate } from "@/lib/page-dates";
```

---

### Slug route handlers (×3): `src/app/[lang]/services/[slug].md/route.ts`, `comparisons/[slug].md/route.ts`, `guides/[slug].md/route.ts` (route handler, request-response)

**Analog:** `src/app/llms.txt/route.ts` (shape) + `src/lib/services.ts` `slugParams`/`serviceBySlug` (slug resolution)

**`generateStaticParams` for slug routes** (`src/lib/services.ts` lines 67–69 for the data source):
```typescript
// src/app/[lang]/services/[slug].md/route.ts
export const dynamic = "force-static";

// Returns slugs for THIS locale only — same guard as services/[slug]/page.tsx.
// See services.ts lines 67-69 for slugParams(); mirrors that file's convention.
export function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return [];
  return slugParams(params.lang);   // from "@/lib/services"
  // for comparisons: comparisonSlugParams(params.lang)
  // for guides:      guideSlugParams(params.lang)
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string; slug: string }> }
): Promise<Response> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });
  const service = serviceBySlug(lang, slug);   // returns undefined → 404
  if (!service) return new Response("Not found", { status: 404 });
  const dict = await getDictionary(lang);
  const canonical = `${site.url}/${lang}${servicePath(service, lang)}`;
  const body = renderServiceMd(lang, dict, service, canonical, ...);
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
```

The `serviceBySlug` / `comparisonBySlug` / `guideBySlug` resolvers are in `src/lib/services.ts` line 72, `src/lib/comparisons.ts` line 96, `src/lib/guides.ts` (same pattern). Always guard: if resolver returns `undefined` → `new Response("Not found", { status: 404 })`.

---

### `src/md-coverage.test.ts` (test)

**Analog:** `src/proxy.test.ts` (import/describe/it/expect structure) + `src/app/llms.txt/route.test.ts` (body-content assertions)

**Vitest idiom** (`src/proxy.test.ts` lines 1–4, `src/app/llms.txt/route.test.ts` lines 10–11):
```typescript
import { describe, it, expect } from "vitest";
// No beforeEach/afterEach needed for pure function tests.
// No vi.mock() needed — md-serializer is pure; sitemap() is pure.
```

**Test structure to mirror** (`src/proxy.test.ts` lines 9–38):
```typescript
// proxy.test.ts pattern: one describe block, multiple it() assertions,
// each independently imports/calls the function under test.
describe("MD twin coverage parity (D-02)", () => {
  it("every sitemap /en URL has a corresponding .md twin path", () => {
    const sitemapPaths = sitemap()
      .map((entry) => new URL(entry.url).pathname)
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

**Route.test.ts assertion idiom** (`src/app/llms.txt/route.test.ts` lines 14–53):
```typescript
// One it() per assertion; each calls GET() fresh (no shared state).
// Assert status, content-type, then body substring checks.
it("returns HTTP 200", async () => {
  const res = await GET();
  expect(res.status).toBe(200);
});
it('returns Content-Type "text/markdown; charset=utf-8"', async () => {
  const res = await GET();
  expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
});
it("body contains YAML frontmatter", async () => {
  const res = await GET();
  const body = await res.text();
  expect(body).toContain("---");
  expect(body).toContain("lang:");
  expect(body).toContain("canonical:");
});
```

Note: nav route handlers import `getDictionary` (which is `server-only`). Do NOT import `GET` from those handlers in unit tests — import `renderXxxMd` from `md-serializer.ts` directly (which has no `"server-only"`). See Pitfall 3 in RESEARCH.md. `llms.txt/route.test.ts` can import `GET` directly because `llms.txt/route.ts` does NOT import `getDictionary`.

---

### `src/proxy.test.ts` addition (test)

**Analog:** `src/proxy.test.ts` lines 10–16 (existing passthrough assertion)

**Pattern to copy verbatim** (`src/proxy.test.ts` lines 5–7, 27–31):
```typescript
// Reuse the existing req() helper (already defined at line 5-7):
function req(path: string) {
  return new NextRequest(new URL(`http://localhost${path}`));
}

// New it() block — same shape as the /llms.txt test (lines 27-31):
it("does not locale-prefix .md routes (EXP-03 merge gate: .md bypass)", async () => {
  // .md routes are excluded from the proxy matcher by the dot-path regex.
  // This test calls proxy() directly (bypasses matcher) and verifies no redirect.
  // Must use locale-PREFIXED paths (/en/about.md not /about.md) — see Pitfall 5
  // in RESEARCH.md: /en.md has no locale prefix so it WOULD redirect if tested
  // without /en/… prefix.
  const mdPaths = [
    "/en/about.md",
    "/en/services/manicure.md",
    "/en/comparisons/gel-vs-regular-manicure.md",
    "/en/guides/manicure-cost-laval.md",
    "/en/services.md",
  ];
  for (const path of mdPaths) {
    const res = await proxy(req(path));
    expect(res.headers.get("location"), `${path} must not redirect`).toBeNull();
  }
});
```

---

### `src/app/llms.txt/route.ts` addition (route handler, existing file)

**Analog:** self — the existing `comparisonLabels` and `guideLabels` Records (lines 18–31)

**Label-Record pattern to extend** (`src/app/llms.txt/route.ts` lines 18–31):
```typescript
// Existing Records — keyed by registry id (type-safe: missing key = type error at build)
const comparisonLabels: Record<(typeof comparisons)[number]["id"], string> = { ... };
const guideLabels: Record<(typeof guides)[number]["id"], string> = { ... };

// NEW: add a serviceDetailLabels Record following the exact same pattern.
// Import services + ServiceId from "@/lib/services" (not already imported).
import { services, servicePath } from "@/lib/services";

const serviceDetailLabels: Record<(typeof services)[number]["id"], string> = {
  manicure: "Manicure",
  pedicure: "Pedicure",
  "lash-extensions": "Lash Extensions",
  waxing: "Waxing",
};
```

**New section to append inside the `body` template string** (after the existing `## Guides` section, before the closing backtick):
```typescript
// Append inside the body template literal, after ## Guides\n${guides...}:
const mdIndex = `
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
${services.map((s) => `- ${serviceDetailLabels[s.id]}: ${site.url}/en${servicePath(s, "en")}.md`).join("\n")}

### Comparisons
${comparisons.map((c) => `- ${comparisonLabels[c.id]}: ${site.url}/en${comparisonPath(c, "en")}.md`).join("\n")}

### Guides
${guides.map((g) => `- ${guideLabels[g.id]}: ${site.url}/en${guidePath(g, "en")}.md`).join("\n")}
`;
// Then append mdIndex to body before the closing backtick/return.
```

---

## Shared Patterns

### `"server-only"` placement rule
**Source:** `src/app/llms.txt/route.ts` (absent — llms.txt doesn't use getDictionary)
**Contrast:** `src/app/[lang]/dictionaries.ts` (has it)
**Apply to:** All `.md` route handlers — add `import "server-only"` as the first line.
**Do NOT apply to:** `src/lib/md-serializer.ts`, `src/lib/md-routes.ts`, `src/lib/page-dates.ts` — these must be importable from Vitest tests.

### `isLocale` guard on all dynamic params
**Source:** Established in `src/lib/i18n.ts` (the `isLocale` type guard), used in every `[lang]` page
**Pattern:**
```typescript
import { isLocale } from "@/lib/i18n";
// In GET handler, first line after awaiting params:
if (!isLocale(lang)) return new Response("Not found", { status: 404 });
```
**Apply to:** All 14 `.md` route handlers (nav + slug).

### Registry `bySlug` → 404 guard
**Source:** `src/lib/services.ts` line 72 (`serviceBySlug` returns `Service | undefined`)
**Pattern:**
```typescript
const item = serviceBySlug(lang, slug); // or comparisonBySlug / guideBySlug
if (!item) return new Response("Not found", { status: 404 });
```
**Apply to:** The 3 slug route handler families only.

### `await params` (Next.js 16 requirement)
**Source:** RESEARCH.md "State of the Art" table — `context.params` is now a `Promise`
**Pattern:**
```typescript
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string }> }     // Promise, not plain object
): Promise<Response> {
  const { lang } = await params;   // always await
```
**Apply to:** All `.md` route handlers that accept dynamic segments.

### Deterministic date via `pageDate()` (not `new Date()`)
**Source:** `src/app/sitemap.ts` lines 45–47 (`pageDate()` helper)
**Pattern:** After `page-dates.ts` is extracted, import `pageDate` from there and call `pageDate("/about")` (or the EN base path for slug routes) to get the `updated` frontmatter string.
**Apply to:** `frontmatter()` call in every `renderXxxMd()` function in `md-serializer.ts`.

### Vitest test runner invocation
**Source:** project memory note `test-runner-vitest.md`
**Rule:** Run tests with `bun run test`, never `bun test`. The latter breaks on Vitest mock API.

---

## No Analog Found

None. All new files have a close codebase analog.

---

## Metadata

**Analog search scope:** `src/app/llms.txt/`, `src/app/sitemap.ts`, `src/lib/services.ts`, `src/lib/comparisons.ts`, `src/proxy.test.ts`, `src/app/llms.txt/route.test.ts`
**Files scanned (read):** 7
**Pattern extraction date:** 2026-06-23
