---
phase: 05-agent-readable-surface-md-twins
reviewed: 2026-06-25T17:20:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - src/lib/page-dates.ts
  - src/lib/md-routes.ts
  - src/lib/md-serializer.ts
  - src/app/sitemap.ts
  - src/app/llms.txt/route.ts
  - src/app/en.md/route.ts
  - src/app/fr.md/route.ts
  - src/app/es.md/route.ts
  - src/app/ar.md/route.ts
  - src/app/[lang]/about.md/route.ts
  - src/app/[lang]/appointments.md/route.ts
  - src/app/[lang]/contact.md/route.ts
  - src/app/[lang]/faq.md/route.ts
  - src/app/[lang]/gallery.md/route.ts
  - src/app/[lang]/laval.md/route.ts
  - src/app/[lang]/privacy.md/route.ts
  - src/app/[lang]/reviews.md/route.ts
  - src/app/[lang]/services.md/route.ts
  - src/app/[lang]/terms.md/route.ts
  - src/app/[lang]/services/[slug]/index.md/route.ts
  - src/app/[lang]/comparisons/[slug]/index.md/route.ts
  - src/app/[lang]/guides/[slug]/index.md/route.ts
  - src/lib/md-serializer.test.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-06-25T17:20:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Reviewed the 23 source/test files for the `.md` twin surface: 3 pure lib modules
(page-dates, md-routes, md-serializer), the refactored sitemap, the llms.txt index,
and all 17 route handlers (4 home + 10 nav + services-index + 3 slug families).

**No Critical findings.** Security posture is sound: every dynamic handler validates
`lang` via `isLocale()` and `slug` via registry lookup (`serviceBySlug` / `comparisonBySlug`
/ `guideBySlug`) before any use, with a 404 on miss — there is no path that lets a
`slug`/`lang` segment reach a filesystem read or template injection. All bodies derive
from committed dictionary/site/registry data. No secrets, no `eval`, no unescaped HTML.
Verified positives: each home twin (`en/fr/es/ar.md`) passes its OWN locale (no copy-paste
`"en"` bug); the previously-shipped-untested `renderServiceMd` related-links URL bug is
correctly fixed (now routes through `mdTwinUrl()` → `/<slug>/index.md`); `generateStaticParams`
locale-guards correctly return `[]` for unknown langs.

The findings are quality/robustness issues. The one with real user-visible impact is
**WR-01** (content drift): the markdown related-links render the raw registry slug-id as
link text where the HTML page renders the localized title — a machine reader gets
`[gel-vs-regular]` instead of `[Gel vs Regular Polish: Which to Choose in Laval?]`. The
remaining three warnings are latent escaping/validation gaps that no current data triggers
but that violate the "never trust data at a boundary" rule and will silently corrupt output
the day a dictionary string gains a `"` or `|`.

## Warnings

### WR-01: renderServiceMd related-links use raw registry id as link text — content drift vs HTML page

**File:** `src/lib/md-serializer.ts:191-205`
**Issue:** The related-comparisons/guides links emit `c.id` / `g.id` (the registry slug-id,
e.g. `gel-vs-regular`) as the visible markdown link text:
```ts
.map((c) => `- [${c.id}](${site.url}${mdTwinUrl(`/${lang}${comparisonPath(c, lang)}`)})`)
```
The canonical HTML page (`src/app/[lang]/services/[slug]/page.tsx:240,250`) renders the
LOCALIZED human title for the same links:
```tsx
{dict.comparisons[cmp.id].title}   // e.g. "Gel vs Regular Polish: Which to Choose in Laval?"
{dict.guides[g.id].title}
```
So the `.md` twin — whose entire purpose is to be the faithful machine-readable mirror of
the page (D-03 "no drift") — shows an internal slug instead of the title, and never localizes
the link text (the id is locale-independent). This is the same class of bug as the URL-hardcoding
defect that was already fixed in this family; the URL was fixed but the link *text* still drifts.
**Fix:** Pull the title from the dictionary, mirroring the page:
```ts
const relatedComparisons = comparisons
  .filter((c) => c.service === service.id)
  .map((c) => `- [${dict.comparisons[c.id].title}](${site.url}${mdTwinUrl(`/${lang}${comparisonPath(c, lang)}`)})`)
  .join("\n");

const relatedGuides = guides
  .filter((g) => g.service === service.id)
  .map((g) => `- [${dict.guides[g.id].title}](${site.url}${mdTwinUrl(`/${lang}${guidePath(g, lang)}`)})`)
  .join("\n");
```

### WR-02: frontmatter() interpolates title into a quoted YAML scalar with no escaping

**File:** `src/lib/md-serializer.ts:43-51`
**Issue:** `frontmatter()` emits `` `title: "${opts.title}"` ``. The surrounding double-quotes
make a colon inside the title safe (verified: comparison/guide titles like
`"Gel vs Regular Polish: Which to Choose in Laval?"` parse fine because they are quoted).
But a title containing a literal `"` would terminate the YAML scalar early and produce a
malformed frontmatter block that any compliant YAML/front-matter parser rejects — corrupting
the whole document for the AI reader. No current dictionary value contains a `"` (grep-verified),
so this is latent, not live. It is still an unvalidated/unescaped value crossing a serialization
boundary (violates "never trust external data / fail loud"), and titles are the field most likely
to gain a quote in future copy.
**Fix:** Escape the two YAML double-quoted-scalar metacharacters (`\` and `"`) before interpolation:
```ts
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
return [
  "---",
  `title: "${esc(opts.title)}"`,
  ...
].join("\n");
```

### WR-03: renderComparisonTable / renderBlocks do not escape pipe (`|`) in cell or list data

**File:** `src/lib/md-serializer.ts:77-87` (table) and `:58-71` (blocks)
**Issue:** `renderComparisonTable` builds rows as `` `| ${row.label} | ${row.cells.join(" | ")} |` ``.
If any `label` or cell ever contains a `|`, it injects a spurious column boundary and the
markdown table row no longer aligns with its header — silently mis-parsed by any table-aware
reader. Current comparison `rows`/`cells` contain no pipes (grep-verified), but several
`metaTitle` strings already use `|` (e.g. `"Manicure in Laval | Sans Souci..."`), proving the
character is in active use elsewhere in the same dictionaries — a future table cell sourced from
similar copy is plausible. Same untrusted-boundary issue as WR-02.
**Fix:** Escape `|` as `\|` in table cells/labels:
```ts
const escCell = (s: string) => s.replace(/\|/g, "\\|");
const header = `| ${columns.map(escCell).join(" | ")} |`;
const dataRows = rows.map(
  (row) => `| ${escCell(row.label)} | ${row.cells.map(escCell).join(" | ")} |`,
);
```

### WR-04: 17 route handlers duplicate near-identical boilerplate — no shared factory

**File:** all 17 `*.md/route.ts` handlers (e.g. `src/app/[lang]/about.md/route.ts`,
`contact.md/route.ts`, `faq.md/route.ts`, … and the 4 home twins)
**Issue:** The 13 `[lang]/*.md` nav handlers are byte-for-byte identical except for (a) the
imported `renderXxxMd` name and (b) the canonical-path suffix string; the 4 home twins differ
only by a hardcoded locale literal; the 3 slug handlers differ only by registry helper names.
This is ~17 copies of the same `force-static` + `isLocale` guard + `getDictionary` + `Response`
sequence. The risk is divergence: a fix to the 404 handling, Content-Type, or guard order
(e.g. a future security hardening) must be applied 17 times and any miss is silent. This
violates the project's "MANY SMALL FILES but high cohesion / no duplication" guidance and
Rule 2/Rule 3 (don't repeat structure that can be a single source of truth).
**Fix:** Extract a factory for the static-locale family, e.g.
```ts
// md-handler.ts
export function makeNavMdHandler(
  pathSuffix: string,
  render: (lang: Locale, dict: Dictionary, canonical: string) => string,
) {
  return {
    dynamic: "force-static" as const,
    generateStaticParams: () => locales.map((lang) => ({ lang })),
    GET: async (_req: Request, { params }: { params: Promise<{ lang: string }> }) => {
      const { lang } = await params;
      if (!isLocale(lang)) return new Response("Not found", { status: 404 });
      const dict = await getDictionary(lang);
      const canonical = `${site.url}/${lang}${pathSuffix}`;
      return new Response(render(lang, dict, canonical), {
        status: 200,
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    },
  };
}
```
Each route file then re-exports `dynamic`, `generateStaticParams`, `GET` from one call. (Next.js
requires the named exports to live in `route.ts`, but the body collapses to one line each.)
Lower priority than WR-01–03 — purely maintainability, no current defect.

## Info

### IN-01: renderServiceMd re-implements comparisonsForService/guidesForService instead of reusing them

**File:** `src/lib/md-serializer.ts:191-192,199-200`
**Issue:** The serializer inlines `comparisons.filter((c) => c.service === service.id)` and
`guides.filter((g) => g.service === service.id)`. `src/lib/comparisons.ts:116` and
`src/lib/guides.ts:81` already export `comparisonsForService(id)` / `guidesForService(id)` with
the exact same body — and the HTML page uses those exports. The output order is currently
identical, but two independent copies of the "related items for a service" rule can silently
diverge (e.g. if the canonical helper later adds sorting/limit). 
**Fix:** Import and call `comparisonsForService(service.id)` / `guidesForService(service.id)` so
the `.md` twin and the HTML page share one selection rule.

### IN-02: proxy STANDALONE_PATHS still lists "/llms.txt" — dead config entry

**File:** `src/proxy.ts:13-19` (and the stale comment in `src/app/llms.txt/route.ts:5-6`)
**Issue:** `/llms.txt` contains a dot, so the matcher's `.*\..*` rule already excludes it from
the proxy entirely (same dot-rule the `.md` twins rely on and that this phase deliberately did
NOT add STANDALONE entries for). The `STANDALONE_PATHS` entry for `/llms.txt` can therefore never
be reached — it is dead config, and the llms.txt header comment ("registered in STANDALONE_PATHS …
the proxy would otherwise redirect") now contradicts the phase-05 decision recorded in both
SUMMARYs. Pre-existing (added in the CRAWL-01 phase) but surfaced here because llms.txt was edited
this phase and the comment is now misleading. 
**Fix:** Remove `"/llms.txt"` from `STANDALONE_PATHS` and correct the route header comment to state
it is excluded by the matcher dot-rule (consistent with every `.md` twin). Verify the existing
proxy.test.ts `/llms.txt` no-Location assertion still passes (it will — the dot-rule covers it).

### IN-03: md-coverage.test.ts only asserts /en parity — silent twin drift possible for fr/es/ar

**File:** `src/md-coverage.test.ts:21,52,57`
**Issue:** Both parity assertions filter to `p.startsWith("/en")`. The D-02 gate therefore proves
EN coverage only. A future route family added with an EN twin but a missing/mis-shaped FR/ES/AR
twin (or a localized-slug mismatch in `mdTwinUrl` for a non-EN locale) would not fail this gate.
Given `defaultLocale` is `"fr"` and slugs are localized per-locale, the non-EN paths are exactly
where a `mdTwinUrl` regex edge case would bite. This is adequate for the stated D-02 intent
("every sitemap /en URL has a twin") but under-covers the multilingual surface the phase actually
ships (96 routes across 4 locales).
**Fix (optional hardening):** Parameterize the two assertions over `locales` instead of hardcoding
`/en`, or add one `it.each(locales)` case. Not blocking — the EN gate does catch a wholly-missing
route family.

### IN-04: renderServiceMd related-links path is tested for URL but not for the rendered body

**File:** `src/lib/md-serializer.test.ts:205-240`
**Issue:** The `renderServiceMd()` suite asserts title/price/included/addons/FAQ but has NO
assertion over the "Related Comparisons" / "Related Guides" sections — the exact code path that
shipped the earlier hardcoded-`.md` URL bug and that still carries the WR-01 link-text drift.
Because `services[0]` (manicure) does have related comparisons and guides, a test here would be
meaningful and would have caught (and would now guard) both the URL fix and WR-01.
**Fix:** Add assertions, e.g. the related section links resolve through `mdTwinUrl` (contains
`/index.md`) and — once WR-01 is fixed — that the link text equals `dict.comparisons[id].title`
rather than the raw id. This closes the loop on the previously-untested defect.

---

_Reviewed: 2026-06-25T17:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
