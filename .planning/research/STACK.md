# Stack Research

**Domain:** AI-Search (SEO + GEO) optimization — existing Next.js 16 local salon website
**Researched:** 2026-06-17
**Confidence:** HIGH

---

## Existing Stack Coverage (Do NOT Re-implement)

This site already implements the following. The roadmap must treat these as DONE:

| What | Where | Status |
|------|-------|--------|
| `NailSalon` + `LocalBusiness` JSON-LD builder | `src/lib/seo.ts` | DONE |
| `AggregateRating` JSON-LD (gated on real review data) | `src/lib/seo.ts` | DONE |
| `Service` JSON-LD builder | `src/lib/seo.ts` | DONE |
| `FAQPage` JSON-LD builder (`faqPageGraph`) | `src/lib/seo.ts` | DONE |
| `BreadcrumbList` JSON-LD builder | `src/lib/seo.ts` | DONE |
| `ImageGallery` / `ImageObject` JSON-LD builder | `src/lib/seo.ts` | DONE |
| `WebSite` graph node | `src/lib/seo.ts` | DONE |
| `<JsonLd>` server component (native `<script type="application/ld+json">`) | `src/components/JsonLd.tsx` | DONE |
| `pageMetadata()` with canonical + hreflang alternates | `src/lib/seo.ts` | DONE |
| `app/sitemap.ts` — multilingual, hreflang alternates, nav/services/comparisons | `src/app/sitemap.ts` | DONE |
| `app/robots.ts` — allow all crawlers, disallow `/api/`, sitemap pointer | `src/app/robots.ts` | DONE |
| `metadataBase` set in root layout | `src/app/[lang]/layout.tsx` | DONE |

**Implication:** The JSON-LD schema layer and the sitemap/robots layer are functionally complete. Research findings about "adding Service/FAQPage/BreadcrumbList schema" or "adding sitemap.ts" apply to the pattern — confirm per-page wiring, not the builders themselves.

---

## What Actually Needs to Be Added

Five distinct technical gaps remain. Each section below names the library/pattern, version, rationale, and overlap status.

---

## 1. JSON-LD: Security Hardening of `<JsonLd>` component

**Gap:** `JsonLd.tsx` does not sanitize `<` characters before inlining JSON. If any schema value ever contains `</script>`, a crawler-facing XSS vector exists.

**Fix:** One-line change, no library needed.

```typescript
// src/components/JsonLd.tsx — replace dangerouslySetInnerHTML value with:
__html: JSON.stringify(data).replace(/</g, "\\u003c"),
```

**Confidence:** HIGH — this is Next.js official docs guidance (nextjs.org/docs/app/guides/json-ld).

**Libraries needed:** None — pure TypeScript string operation.

---

## 2. JSON-LD: TypeScript Type Safety (`schema-dts`)

**Gap:** `seo.ts` builds schema objects as plain `object` / `Record<string, unknown>`. No compile-time validation that `@type`, required fields, or value shapes are correct. Schema errors are silent until crawl time.

**Recommendation:** Add `schema-dts` for compile-time schema.org type coverage.

### Supporting Libraries

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `schema-dts` | `^2.0.0` | TypeScript types for schema.org vocabulary | Official Google-authored package. Catches missing required fields and wrong `@type` values at compile time. Zero runtime cost — types only. Current release is 2.0.0 (covers Schema.org v30+). |

**Installation:**

```bash
bun add -D schema-dts
```

**Usage pattern** (extend existing `seo.ts` builders):

```typescript
import type { NailSalon, WithContext } from "schema-dts";

export function businessGraph(...): WithContext<NailSalon> {
  return {
    "@context": "https://schema.org",
    "@type": "NailSalon",
    // TypeScript now validates every field shape
  };
}
```

**Alternatives considered:**

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `schema-dts` | Hand-rolled types | Google-maintained, covers all 700+ types, regenerated from schema.org spec. Hand-rolling drifts. |
| `schema-dts` | `schema-org-types` | Smaller community, less frequently updated. |

**Confidence:** HIGH — npm `schema-dts@2.0.0`, published March 2026, Google-authored.

---

## 3. GA4 AI-Referrer Segmentation (No Library — Configuration)

**Gap:** No GA4 measurement ID in the codebase. No AI traffic attribution. AI-referred sessions are currently misattributed to Direct (Claude strips referrers) or untracked (no GA4).

**Recommendation:** Implement GA4 with a custom channel group for AI referrers. This is a **configuration task**, not a library task. The only code addition is a `<Script>` tag in the root layout.

### Core Technologies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Google Analytics 4 | N/A (external service) | RUM analytics baseline, conversion tracking | Free, dominant, required for Search Console integration. GA4 now has a native "AI Assistant" channel but it misses ~35–70% of AI sessions due to referrer stripping. |
| GA4 Custom Channel Group | N/A (GA4 admin config) | Capture AI traffic that passes referrers | Built in GA4 Admin → Data settings → Channel groups. Applies retroactively. |
| `next/script` with `strategy="afterInteractive"` | Next.js 16 built-in | Load GA4 without blocking INP | `afterInteractive` fires after hydration — never blocks LCP or INP. Do not use `strategy="beforeInteractive"` for analytics. |

**GA4 AI referrer regex** (place above Referral and Direct in channel priority):

```
chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com
```

**No npm package needed.** Do not add `@next/third-parties` just for GA4 — the built-in `next/script` approach gives identical INP characteristics with less abstraction.

**What NOT to use:**

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@next/third-parties` GA4 wrapper | Adds a dependency layer for trivial config, undocumented caching behavior, harder to customize | `next/script` + gtag.js directly |
| `react-ga4` | Unmaintained, React 18 patterns, doesn't support GA4 well | gtag.js via `next/script` |
| Client-side-only tracking | Misses SSR page views | Pair `next/script` tag with `pageview` event fired on `usePathname` changes |

**Confidence:** HIGH — GA4 channel groups are stable, verified across 5 sources. The 35–70% dark AI traffic figure is from Statcounter March 2026 data.

---

## 4. `llms.txt` (Static File — No Library)

**Gap:** No `/llms.txt` exists. This is the emerging convention for signaling to AI crawlers (GPTBot, ClaudeBot, PerplexityBot) what content is authoritative and worth indexing.

**Recommendation:** Create as a static file in `public/`. No library, no build step.

**Current status of the standard (important caveats):**
- `llms.txt` is a proposed standard from llmstxt.org, not ratified by OpenAI/Anthropic/Google
- Google explicitly confirmed (John Mueller, 2025) it has no effect on Google Search ranking
- Anthropic publishes one on anthropic.com — signals they are open to the idea
- **Practical value:** Forces you to articulate your most important content. Even if no crawler reads it today, early adoption has zero cost and asymmetric upside.

**Implementation:** Static markdown file at `public/llms.txt` — Next.js serves `public/` as root.

**Format (spec-compliant):**

```markdown
# Ongles Sans Souci

> Montreal nail salon specializing in gel, acrylic, and classic nail care. Four languages (en/fr/es/ar). Single location, Montréal, QC.

## Services
- [Services overview](https://onglessanssouci.com/en/services): Full service menu with pricing
- [Gel manicure](https://onglessanssouci.com/en/services/gel-manicure): What it is, how long it lasts
- [Acrylic nails](https://onglessanssouci.com/en/services/acrylic-nails): Types, care, removal

## FAQ
- [FAQ](https://onglessanssouci.com/en/faq): Common questions about booking, pricing, nail care

## Optional
- [Gallery](https://onglessanssouci.com/en/gallery): Photo portfolio
- [Reviews](https://onglessanssouci.com/en/reviews): Client reviews
```

**Also add pointer in `robots.ts`:** The `host` field already exists. Add a comment noting that `/llms.txt` is intentionally not disallowed (it should be openly crawlable).

**What NOT to use:**

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| npm packages that generate llms.txt | Overkill for a 15-line static file; spec is still evolving | Hand-authored `public/llms.txt` |
| Dynamically generated `llms.txt` route | Adds complexity for content that changes infrequently | Static file, update manually with content changes |

**Confidence:** MEDIUM — Standard is proposed, not ratified. Implementation cost is near-zero. Risk is near-zero.

---

## 5. Core Web Vitals Tooling (INP Measurement)

**Gap:** No RUM (Real User Monitoring) pipeline. Lighthouse scores don't measure INP (INP requires real user interactions). The Framer Motion + client component stack has known INP risk from main-thread animation work.

**Recommendation:** Two-tool approach — bundle analysis in CI + RUM in production.

### Supporting Libraries

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@next/bundle-analyzer` | `^15.3.3` (tracks Next.js version) | Interactive treemap of client JS bundles | Identifies oversized dependencies before they ship. Framer Motion 12 ships ~47KB gzipped — verify it is not double-loaded. Run with `ANALYZE=true bun run build`. |
| `web-vitals` | `^4.2.4` | Real User Monitoring — INP, LCP, CLS from actual visitors | Google-authored. INP cannot be measured any other way. Feeds into a `/api/vitals` endpoint or Vercel Analytics. The only source of truth for ranking-relevant field data. |

**Installation:**

```bash
bun add web-vitals
bun add -D @next/bundle-analyzer
```

**Usage — `web-vitals` RUM hook** (extend existing `src/app/[lang]/layout.tsx` or a new `src/components/WebVitals.tsx` client component):

```typescript
"use client";
import { onINP, onLCP, onCLS } from "web-vitals";
import { useEffect } from "react";

export function WebVitals() {
  useEffect(() => {
    onINP((metric) => sendToEndpoint(metric));
    onLCP((metric) => sendToEndpoint(metric));
    onCLS((metric) => sendToEndpoint(metric));
  }, []);
  return null;
}

function sendToEndpoint(metric: { name: string; value: number; id: string }) {
  navigator.sendBeacon("/api/vitals", JSON.stringify(metric));
}
```

**Bundle analyzer config** (wrap existing `next.config.ts`):

```typescript
// next.config.ts
import withBundleAnalyzer from "@next/bundle-analyzer";
const analyze = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
export default analyze(nextConfig);
```

**Alternatives considered:**

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `web-vitals` | Vercel Analytics | Vercel Analytics requires Vercel hosting; this site deploys via Dokploy to a custom server. `web-vitals` is self-hostable. |
| `web-vitals` | Lighthouse CI | Lighthouse cannot measure INP (no real interactions). Use it for LCP/CLS regression gates only, not INP. |
| `@next/bundle-analyzer` | `webpack-bundle-analyzer` | `@next/bundle-analyzer` wraps it for Next.js config; same output, less ceremony. |

**What NOT to use:**

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Lighthouse alone for INP | Lighthouse has zero interaction — TBT is not INP | `web-vitals` RUM |
| `strategy="beforeInteractive"` for any analytics | Blocks hydration, kills INP score | `strategy="afterInteractive"` |
| Turbopack as a CWV fix | Improves dev HMR speed, not runtime CWV | Bundle analysis + dynamic imports for runtime CWV |

**2025 INP thresholds:** Good < 200ms / Needs improvement 200–500ms / Poor > 500ms. Google uses 75th-percentile field data over a 28-day rolling window. Only 48% of mobile origins pass all three CWVs per 2025 Web Almanac.

**Confidence:** HIGH — `web-vitals@4.2.4` published December 2024, stable API. `@next/bundle-analyzer` is first-party Next.js tooling.

---

## Complete Installation Summary

```bash
# Runtime (schema type safety)
bun add schema-dts

# Dev tooling (bundle analysis)
bun add -D @next/bundle-analyzer

# RUM (Core Web Vitals field measurement)
bun add web-vitals
```

**No install needed for:**
- JSON-LD `<` sanitization (one-line change to `JsonLd.tsx`)
- GA4 segmentation (GA4 admin config + `next/script` tag, no npm)
- `llms.txt` (static file in `public/`)
- sitemap, robots, hreflang, canonical, `generateMetadata`, `<JsonLd>` component (all DONE)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|----------------|-------|
| `schema-dts@2.0.0` | TypeScript 5.x | Types-only package, zero runtime impact. Compatible with strict mode. |
| `@next/bundle-analyzer@15.3.x` | Next.js 16.2.6 | Minor version should match or be one behind Next.js minor. 15.3.x is compatible with 16.x. |
| `web-vitals@4.2.4` | React 19, Next.js 16 App Router | Uses `useEffect` pattern; must be in a `"use client"` component. `sendBeacon` has universal browser support. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next-sitemap` npm package | `app/sitemap.ts` is already implemented natively and correctly; `next-sitemap` would duplicate it | Existing `src/app/sitemap.ts` |
| `react-schemaorg` | Unmaintained (last release 2021), not App Router aware | Native `<script type="application/ld+json">` via existing `<JsonLd>` |
| `next-seo` | Designed for Pages Router; `generateMetadata` is the App Router canonical API | Existing `pageMetadata()` in `src/lib/seo.ts` |
| `@next/third-parties` for GA4 | Abstracts away `next/script` with no benefit; harder to add custom events | `next/script` directly |
| `serialize-javascript` for JSON-LD sanitization | Full npm package for what is a one-line `.replace()` call | `.replace(/</g, "\\u003c")` in `JsonLd.tsx` |

---

## Sources

- [Next.js JSON-LD Official Guide](https://nextjs.org/docs/app/guides/json-ld) — XSS sanitization pattern, native `<script>` vs `next/script` recommendation (HIGH confidence)
- [Next.js generateMetadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) — `alternates.languages` / hreflang pattern (HIGH confidence)
- [Next.js sitemap.ts API](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) — native sitemap convention, `alternates.languages` in entries (HIGH confidence)
- [llmstxt.org specification](https://llmstxt.org/) — official format, section ordering, `llms-full.txt` distinction (MEDIUM confidence — proposed standard)
- [GA4 AI attribution guide — Discovered Labs](https://discoveredlabs.com/blog/how-to-track-chatgpt-perplexity-and-ai-overviews-traffic-in-ga4-without-guessing) — regex pattern, channel priority order (HIGH confidence)
- [GA4 AI referrer behavior — MarTech](https://martech.org/how-ga4-records-traffic-from-perplexity-comet-and-chatgpt-atlas/) — native AI Assistant channel limitations (HIGH confidence)
- [schema-dts npm](https://www.npmjs.com/package/schema-dts) — v2.0.0, Google-authored (HIGH confidence)
- [web-vitals npm](https://www.npmjs.com/package/web-vitals) — v4.2.4, Google-authored (HIGH confidence)
- [Core Web Vitals + Next.js — Vercel Academy](https://vercel.com/academy/nextjs-foundations/core-web-vitals-and-measurement) — INP measurement approach, `useReportWebVitals` (HIGH confidence)
- [FAQ schema for AI/GEO — Frase.io](https://www.frase.io/blog/faq-schema-ai-search-geo-aeo) — FAQPage citation rates in AI answer engines (MEDIUM confidence)
- [GEO for local business — Salesforce](https://www.salesforce.com/blog/generative-engine-optimization/) — schema types for AI citability (MEDIUM confidence)

---

*Stack research for: Ongles Sans Souci — AI-Search (SEO + GEO) milestone*
*Researched: 2026-06-17*
