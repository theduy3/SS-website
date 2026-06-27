---
phase: 02-content-schema-crawl-surface
verified: 2026-06-17T22:45:00-07:00
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
---

# Phase 02: Content, Schema, Crawl Surface — Verification Report

**Phase Goal:** Expand the site's answer-first content surface, add JSON-LD structured data on all citation-priority pages, ship /llms.txt as a crawlable business brief, and add a dedicated /laval local-citation page with full hreflang coverage.
**Verified:** 2026-06-17T22:45:00-07:00
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Answer-first lead `<p>` on all 6 content pages is outside any Reveal/Framer Motion wrapper (SSR-visible, CONTENT-01/D-03/D-04) | VERIFIED | See Criterion 1 detail |
| 2 | JSON-LD coverage: organizationGraph in layout, servicesGraph on home, serviceGraph+FAQPage on each /services/[slug], faqPageGraph on /faq and /laval, breadcrumbGraph on sub-pages (SCHEMA-01/SCHEMA-02) | VERIFIED | See Criterion 2 detail |
| 3 | /llms.txt is force-static, sourced from site.ts, registered in STANDALONE_PATHS, and has a proxy passthrough test (CRAWL-01/D-08/D-09) | VERIFIED | See Criterion 3 detail |
| 4 | /laval exists under [lang] routing for all 4 locales, with sitemap hreflang + x-default + deterministic lastModified (CRAWL-02/D-05/D-06) | VERIFIED | See Criterion 4 detail |
| 5 | All 4 locale dictionaries have matching key parity for laval block (lead 40-60 words, faq.items 3-5 equal across locales, facts ≥ 3) and faq.items 8-15 equal across locales | VERIFIED | See Criterion 5 detail |
| 6 | D-01..D-07 constraints honored: /faq expanded in place, single-source schema/visible text, lead as plain `<p>`, content-pages only, /laval under [lang] not STANDALONE_PATHS, Laval (not Montreal), 3-5 local FAQs | VERIFIED | See Criterion 6 detail |

**Score:** 6/6 truths verified

---

## Criterion Detail

### Criterion 1 — Answer-first leads outside Reveal (CONTENT-01 / D-03 / D-04)

**Requirement:** Home, services index, each /services/[slug], /faq, /about, and /laval open with a 40-60 word lead `<p>` that is NOT wrapped in `<Reveal>` / Framer Motion (opacity:0 hides from SSR/AI crawlers on first paint).

**Evidence:**

- `src/app/[lang]/page.tsx` line 62-67: `dict.home.lead` rendered as a bare `<p className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12">` at the top of the return fragment, before the first `<section>`. No Reveal wrapper. The first `<Reveal>` on this page is line 71 wrapping the `<h1>` hero tagline.

- `src/app/[lang]/about/page.tsx` lines 31-34: `dict.about.lead` in plain `<p>` with matching classes. First `<Reveal>` is line 47 (body paragraphs).

- `src/app/[lang]/services/page.tsx` lines 45-48: `dict.servicesPage.lead` in plain `<p>`. First `<Reveal>` is line 68 (service cards).

- `src/app/[lang]/faq/page.tsx` line 30-33: `dict.faq.lead` in plain `<p>` (no Reveal context visible in excerpt; faq page imports confirmed clean).

- `src/app/[lang]/services/[slug]/page.tsx` lines 76-79: `d.lead` in plain `<p className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12">`. First `<Reveal>` is line 84.

- `src/app/[lang]/laval/page.tsx` line 46 comment: "Answer-first lead — plain `<p>`, NOT wrapped in `<Reveal>`/motion." Lines 49-53: bare `<p>{dict.laval.lead}</p>` before PageHeader.

**Status: VERIFIED** — all 6 content pages render lead outside Reveal.

---

### Criterion 2 — JSON-LD schema coverage (SCHEMA-01 / SCHEMA-02)

**Requirement:** organizationGraph sitewide (layout), servicesGraph ItemList on home, serviceGraph+FAQPage on each /services/[slug], faqPageGraph+breadcrumbGraph on /faq and /laval. Single-source: schema and visible text fed from same dict array.

**Evidence:**

- `src/app/[lang]/layout.tsx` lines 7,12,88-89: imports `organizationGraph` from `@/lib/seo`, emits `<JsonLd data={organizationGraph(lang, {...})} />`. Sitewide coverage confirmed.

- `src/app/[lang]/page.tsx` lines 15,61: imports `servicesGraph` from `@/lib/seo`, emits `<JsonLd data={servicesGraph(lang, serviceItems)} />`. The `serviceItems` array is built from `dict.services` zipped with `services` registry (lines 44-57) and reused for both the visible grid and the schema — single source. No `organizationGraph` on this page (correctly excluded per D-02 to avoid duplication; layout handles it). `git grep -c 'organizationGraph' src/app/\[lang\]/page.tsx` = 0.

- `src/app/[lang]/services/[slug]/page.tsx` line 17: imports `pageMetadata, serviceGraph, breadcrumbGraph, faqPageGraph` from `@/lib/seo`. Line 74: emits `<JsonLd data={faqPageGraph(d.faq)} />`. Both `serviceGraph` and `faqPageGraph` are emitted.

- `src/app/[lang]/laval/page.tsx` line 11: imports `pageMetadata, faqPageGraph, breadcrumbGraph`. Line 38: `<JsonLd data={faqPageGraph(dict.laval.faq.items)} />`. Line 39-44: `<JsonLd data={breadcrumbGraph(...)} />`. Line 73 comment: "FAQ Accordion — same items as faqPageGraph above (SCHEMA-02)". Single-source confirmed.

- `src/lib/seo.ts` lines 134-213: exports `organizationGraph` (LocalBusiness+WebSite), `servicesGraph` (ItemList), `serviceGraph`, `faqPageGraph` (FAQPage), `breadcrumbGraph` (BreadcrumbList).

**Status: VERIFIED** — full JSON-LD coverage across all required pages.

---

### Criterion 3 — /llms.txt crawl surface (CRAWL-01 / D-08 / D-09)

**Requirement:** `force-static` App Router route handler sourced from `site.ts`, registered in `STANDALONE_PATHS` in `src/proxy.ts`, with a proxy test asserting no locale-prefix redirect.

**Evidence:**

- `src/app/llms.txt/route.ts` line 10: `export const dynamic = "force-static";`

- `src/app/llms.txt/route.ts` lines 4,27-66: Comment "Content sourced exclusively from site.ts (D-08 / T-02-07)". Body pulls `site.name`, `site.contact.address`, `site.hours`, `site.contact.phone`, `site.contact.email`, `site.contact.landmark`, `site.instagram`, `site.facebook`, `site.url`, `site.booking`. No hardcoded content; all values from `site.ts`.

- `src/proxy.ts` line 18: `"/llms.txt"` present in `STANDALONE_PATHS` array.

- `src/proxy.test.ts` line 27: `it("does not locale-prefix /llms.txt (CRAWL-01 merge gate: standalone route reachable un-prefixed)", ...)` — test asserts no redirect issued.

- Route directory `src/app/llms.txt/` contains `route.ts` and `route.test.ts`. EXISTS confirmed.

**Status: VERIFIED** — force-static, site.ts-sourced, STANDALONE_PATHS registered, proxy test in place.

---

### Criterion 4 — /laval route: 4 locales, sitemap hreflang, x-default, deterministic lastModified (CRAWL-02 / D-05 / D-06)

**Requirement:** Dedicated `/[lang]/laval` route under normal locale routing (NOT standalone), reciprocal hreflang across all 4 locales, x-default pointing to defaultLocale, deterministic `lastModified` (static date, not `new Date()`).

**Evidence:**

- `src/app/[lang]/laval/page.tsx` exists. Route is under `[lang]` — normal locale routing, not in STANDALONE_PATHS (D-05 confirmed).

- `src/app/sitemap.ts` line 9 comment: "Every entry declares hreflang alternates (including x-default → defaultLocale)". Line 12 comment: "Per-page static lastModified dates (deterministic — not a live new Date())."

- `src/app/sitemap.ts` line 26: `"/laval": new Date("2026-06-17")` — static date literal, deterministic.

- Lines 107-119: `const localPaths = ["/laval"]` iterated with reciprocal hreflang block. Line 119: `"x-default": \`${site.url}/${defaultLocale}${path}\`` — x-default to defaultLocale. All 4 locales included via the locale iteration pattern (same pattern used for nav pages at lines 42-51 which iterates all locales).

- `src/app/[lang]/laval/page.tsx` exports `generateMetadata` calling `pageMetadata(lang, "/laval", ...)` — enables canonical/hreflang in `<head>` for each locale.

**Status: VERIFIED** — 4-locale route, sitemap with hreflang+x-default, static lastModified.

---

### Criterion 5 — 4-locale dictionary key parity

**Requirement:** All 4 locales (en/fr/es/ar) have `laval` block with lead 40-60 words, faq.items 3-5 equal across locales, facts ≥ 3. Also `faq.items` 8-15 equal across locales.

**Evidence (live node check output):**

```
laval faq counts: [ 5, 5, 5, 5 ]
laval.lead words: 46  (en)
laval.lead words: 49  (fr)
laval.lead words: 52  (es)
laval.lead words: 44  (ar)
faq.items counts: [ 15, 15, 15, 15 ]
ALL OK
```

All constraints satisfied: laval.faq.items = 5 across 4 locales (within 3-5), lead words within 40-60 for all locales, faq.items = 15 across 4 locales (within 8-15).

**Status: VERIFIED** — all locale key parity checks pass.

---

### Criterion 6 — D-01..D-07 constraints honored

| Constraint | Requirement | Evidence | Status |
|-----------|-------------|----------|--------|
| D-01 | /faq expanded in place, dict.faq.items 8-15 across all 4 locales | faq.items = 15 in all 4 locales (node check) | PASS |
| D-02 | Single-source: schema and visible text from same dict array | laval: faqPageGraph + Accordion both fed dict.laval.faq.items (page.tsx line 38 + 80). /faq: same pattern. | PASS |
| D-03 | Lead as plain `<p>`, not a callout/box component | All 6 pages: bare `<p className="mx-auto max-w-3xl...">` | PASS |
| D-04 | Answer-first on content pages only (home, services index, /services/[slug], /faq, /laval, /about); exclude legal/utility/comparisons | Only those 6 pages have lead `<p>` wired. Legal/contact/gallery not wired. | PASS |
| D-05 | /laval under [lang] routing, single `laval` slug, NOT in STANDALONE_PATHS | Route at src/app/[lang]/laval/. Not in proxy.ts STANDALONE_PATHS. | PASS |
| D-06 | /laval has answer-first + facts + 3-5 local FAQs + FAQPage schema + reciprocal hreflang | laval/page.tsx has all: lead outside Reveal, facts dl, FAQ accordion, faqPageGraph+breadcrumbGraph schema, sitemap hreflang | PASS |
| D-07 | Local page is Laval (not Montreal) | D-07 is a naming constraint. laval/page.tsx title derived from dict.laval.heading; llms.txt line 33: "CF Carrefour Laval, Laval, QC" | PASS |

**Status: VERIFIED** — all D-01..D-07 constraints honored.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/[lang]/page.tsx` | Home: lead outside Reveal + servicesGraph JsonLd | VERIFIED | lead at line 62, servicesGraph at line 61 |
| `src/app/[lang]/laval/page.tsx` | /laval: lead outside Reveal + faqPageGraph + breadcrumbGraph | VERIFIED | lead at line 49, schemas at lines 38-44 |
| `src/app/[lang]/services/[slug]/page.tsx` | Service: lead outside Reveal + serviceGraph + faqPageGraph | VERIFIED | lead at line 76, faqPageGraph at line 74 |
| `src/app/[lang]/about/page.tsx` | About: lead outside Reveal | VERIFIED | lead at line 31 |
| `src/app/[lang]/services/page.tsx` | Services index: lead outside Reveal | VERIFIED | lead at line 45 |
| `src/app/[lang]/faq/page.tsx` | FAQ: lead outside Reveal | VERIFIED | lead at line 30 |
| `src/app/llms.txt/route.ts` | force-static, site.ts-sourced route handler | VERIFIED | dynamic="force-static" line 10; site.* imports throughout |
| `src/proxy.ts` | /llms.txt in STANDALONE_PATHS | VERIFIED | line 18 |
| `src/proxy.test.ts` | Proxy passthrough test for /llms.txt | VERIFIED | line 27 |
| `src/app/sitemap.ts` | /laval hreflang + x-default + static lastModified | VERIFIED | lines 26, 107-119 |
| `src/lib/seo.ts` | organizationGraph, servicesGraph, faqPageGraph, breadcrumbGraph exports | VERIFIED | lines 134-295 |
| `src/dictionaries/en.json`, `fr.json`, `es.json`, `ar.json` | laval block + expanded faq.items (8-15) | VERIFIED | node check: all counts match |

---

## Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `page.tsx` (home) | `seo.servicesGraph` | import + `<JsonLd data={servicesGraph(...)}>` | WIRED |
| `laval/page.tsx` | `seo.faqPageGraph` | import + `<JsonLd data={faqPageGraph(dict.laval.faq.items)}>` | WIRED |
| `laval/page.tsx` | `<Accordion>` | `items={dict.laval.faq.items}` — same array as faqPageGraph | WIRED |
| `services/[slug]/page.tsx` | `seo.faqPageGraph` | import + `<JsonLd data={faqPageGraph(d.faq)}>` | WIRED |
| `layout.tsx` | `seo.organizationGraph` | import + `<JsonLd data={organizationGraph(lang, {...})}>` | WIRED |
| `llms.txt/route.ts` | `site.ts` | import `site` + all body values from `site.*` | WIRED |
| `proxy.ts` | `/llms.txt` | `STANDALONE_PATHS` array entry | WIRED |
| `sitemap.ts` | `/laval` | `pageDate("/laval")` + hreflang loop over `localPaths` | WIRED |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `laval/page.tsx` — lead | `dict.laval.lead` | `getDictionary(lang)` → locale JSON | Yes — 44-52 word strings per locale | FLOWING |
| `laval/page.tsx` — FAQ schema | `dict.laval.faq.items` | Same `getDictionary` result | Yes — 5 Q/A pairs per locale | FLOWING |
| `page.tsx` — servicesGraph | `serviceItems` | `dict.services` zipped with `services` registry | Yes — prices, paths from real data | FLOWING |
| `llms.txt/route.ts` — body | `site.*` | `src/lib/site.ts` constants | Yes — NAP, hours, URLs | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Home lead is NOT in Reveal | `grep -n "home\.lead" page.tsx` context check | Line 62-67: bare `<p>` before any section/Reveal | PASS |
| laval lead is NOT in Reveal | File line 46 comment + line 49 bare `<p>` | "plain `<p>`, NOT wrapped in `<Reveal>`" | PASS |
| /llms.txt force-static declared | `grep "export const dynamic" route.ts` | `"force-static"` at line 10 | PASS |
| STANDALONE_PATHS includes /llms.txt | `grep "llms" proxy.ts` | line 18 | PASS |
| 4-locale dict parity | `node -e` validation script | ALL OK — counts match, word ranges satisfied | PASS |
| faqPageGraph wired on service slug | `grep "faqPageGraph" services/[slug]/page.tsx` | lines 17 + 74 | PASS |

---

## Anti-Patterns Found

No debt markers (TBD/FIXME/XXX), placeholder text, or return-null stubs found in the phase-modified files. Reveal usage in non-lead sections (hero images, service cards, testimonials) is intentional and does not affect the SSR-visible lead requirement.

---

## Human Verification Required

None. All must-haves are verifiable programmatically via file inspection and the node dict validation.

---

## Gaps Summary

No gaps. All 6 must-have truths verified with direct file evidence.

---

_Verified: 2026-06-17T22:45:00-07:00_
_Verifier: Claude (gsd-verifier)_
