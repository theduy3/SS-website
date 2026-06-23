# Phase 2: Content, Schema & Crawl Surface - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Make every key page citable by AI answer engines and crawlable by AI agents, by:
1. Opening **content pages** with a 40–60-word direct answer block in SSR HTML.
2. Expanding the **existing `/faq` hub** into a real knowledge hub (~8–15 factual Q/As) in all 4 locales, with `FAQPage` schema that mirrors visible copy verbatim.
3. Wiring per-route JSON-LD coverage (`Service` + `FAQPage` + `BreadcrumbList`) so each key route emits correct schema in raw HTML.
4. Shipping a dedicated **Laval local page** with local FAQ signals.
5. Adding a curated **`/llms.txt`** agent entry point and fixing sitemap crawl hygiene (`x-default`, accurate `lastModified`).

Everything is SSR-verified by `curl` of raw HTML before merge.

**This is mostly wiring + content discipline, not new schema infrastructure** — builders already exist in `src/lib/seo.ts`. Routes (`/faq`, `/services/[slug]`, `/comparisons/[slug]`, `/about`, `/reviews`, `/gallery`) already render and already emit some schema; this phase fills the per-route gaps and adds answer-first copy.

</domain>

<decisions>
## Implementation Decisions

### FAQ Knowledge Hub
- **D-01:** Expand the **existing `/faq` route in place** (do NOT restructure into a categorized hub). Grow `dict.faq.items` to ~8–15 concise, factual Q/As covering hours, booking, parking (CF Carrefour Laval), services, pricing, and walk-ins, across all 4 locales (en/fr/es/ar).
- **D-02:** SCHEMA-02 (verbatim match) is **structurally satisfied by construction** — the `/faq` route already feeds the same `dict.faq.items` into both `faqPageGraph()` (schema) and `<Accordion>` (visible copy). Keep this single-source pattern; never let schema text and visible text diverge.

### Answer-First Blocks (CONTENT-01)
- **D-03:** Answer-first = a **lead-paragraph** (not a separate callout/box component), dictionary-driven, rendered at the top of the page in SSR HTML.
- **D-04:** Apply answer-first to **content pages only**: home, services index, each `/services/[slug]`, the FAQ hub, the Laval page, and about. **Exclude** legal/utility/low-citation pages (privacy, terms, contact, gallery, reviews) and `/comparisons/[slug]`. Rationale: avoid ×4-locale translation cost on low-citation-value pages.

### Laval Local Page (CONTENT-03)
- **D-05:** Build a **dedicated `/laval` route** under normal `[lang]` locale routing — single slug `laval` across all 4 locales (NOT a per-locale slug). It is a public localized page, so it does **NOT** go in `STANDALONE_PATHS`.
- **D-06:** Page content = answer-first block + location/parking/transit/landmark facts + **3–5 Laval-specific FAQ Q/As with their own `FAQPage` schema**. Must have reciprocal hreflang across all 4 locales and a sitemap entry.
- **D-07:** This reconciles Phase-1 D-02: the local page is **Laval**, not Montreal.

### llms.txt (CRAWL-01)
- **D-08:** `/llms.txt` = curated **business brief**: business summary, NAP pulled from `src/lib/site.ts`, services list, hours, booking/contact links, and links to key pages (faq, services, laval). Single canonical language (**EN**) with a note that fr/es/ar variants exist.
- **D-09:** Implement as a `force-static` App Router route handler (`src/app/llms.txt/route.ts`). MUST add `/llms.txt` to `STANDALONE_PATHS` in `src/proxy.ts` **and** add a `src/proxy.test.ts` assertion locking the locale-routing exemption (build will NOT catch a missing entry — runtime-only 404; see canonical refs).

### Copy Authorship Workflow
- **D-10:** Claude **drafts factual EN copy** (answer blocks, expanded FAQ, Laval content, llms.txt) from the existing dictionary tone + NAP in `site.ts`. **User reviews EN first.** Only after EN approval are fr/es/ar translated. Because schema reads the same dictionary keys, verbatim schema/copy match is preserved automatically.

### Claude's Discretion (technical wiring — not user decisions, but roadmap-mandated)
- **Service-page `FAQPage` emission:** ROADMAP success criterion 2 requires `/services/[slug]` raw HTML to contain **`Service` + `FAQPage`** JSON-LD. Service routes currently emit `serviceGraph` + `breadcrumbGraph` only. Wire `faqPageGraph()` onto each service page using the **per-service FAQ data already present in the dictionaries** (`src/dictionaries/*.json`, e.g. `services[].faq`). D-01's "expand /faq in place" choice was about the hub and does **not** drop this per-service requirement.
- **`AggregateRating` gate (SCHEMA-03):** keep behind the existing review-fetch script — emit only when live Google-reviews data is present. Do not bypass.
- **Sitemap hygiene (CRAWL-02):** add `x-default` alternate and replace the single `lastModified = new Date()` with accurate per-page modification dates; add the new `/laval` route. Approach (git mtime vs content-hash vs static) is Claude's call in planning.
- **Per-route schema audit:** confirm home + services-index also emit the expected blocks (`organizationGraph` / `servicesGraph` / breadcrumb); fill any gaps found.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase contract & prior decisions
- `.planning/ROADMAP.md` § "Phase 2" — goal + 4 success criteria (the curl-verifiable acceptance bar)
- `.planning/REQUIREMENTS.md` — SCHEMA-01/02/03, CONTENT-01/02/03, CRAWL-01/02
- `.planning/PROJECT.md` § "Active" / "Context" / "Constraints" — milestone scope, i18n+RTL model, SSR rule
- `.planning/phases/01-foundation-prerequisites/01-CONTEXT.md` — Phase-1 locks: `site.ts` = NAP SoT, `JsonLd.tsx` escaping, Laval identity (carry forward, do not re-litigate)

### Crawl-coupling gotcha (MANDATORY for llms.txt)
- `.planning/codebase/CONCERNS.md` — standalone-route ↔ proxy coupling
- Project memory `standalone-route-proxy-coupling` — any new un-localized route needs a `STANDALONE_PATHS` entry in `src/proxy.ts` + a `src/proxy.test.ts` assertion; build won't catch a missing entry

### Existing code to reuse / extend
- `src/lib/seo.ts` — builders: `pageMetadata`, `organizationGraph`, `servicesGraph`, `serviceGraph`, `faqPageGraph`, `imageGalleryGraph`, `breadcrumbGraph`
- `src/lib/site.ts` — NAP source of truth (name/address/phone/hours/url/nav)
- `src/lib/services.ts` — services list + localized `servicePath()` slug convention
- `src/app/[lang]/faq/page.tsx` — existing FAQ pattern (the single-source schema+copy model to follow)
- `src/app/[lang]/services/[slug]/page.tsx` — existing service-schema pattern (extend with FAQPage)
- `src/app/sitemap.ts` — sitemap to extend (x-default, lastModified, /laval)
- `src/proxy.ts` (`STANDALONE_PATHS`) + `src/proxy.test.ts` — llms.txt exemption + test
- `src/dictionaries/{en,fr,es,ar}.json` — `faq.items` + per-service `faq` arrays (copy lives here)
- `src/components/{Accordion,PageHeader,JsonLd}.tsx` — reusable rendering primitives

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Schema builders (`src/lib/seo.ts`):** all needed builders already exist — phase work is *calling* them per route, not writing new ones.
- **`JsonLd` component:** already escapes `<` → `<` (Phase 1 D-10) before `dangerouslySetInnerHTML` — safe to inline new schema.
- **`Accordion` + single-source `dict.faq.items`:** reuse verbatim for the expanded hub; guarantees SCHEMA-02 match.
- **`pageMetadata()`:** already produces hreflang/canonical metadata — reuse for the new `/laval` route.
- **`getDictionary(lang)` + `[lang]` routing:** new `/laval` page slots into the existing i18n loader; no routing changes needed (it's localized, not standalone).
- **`servicePath()` localized-slug convention:** precedent for any per-locale slug — but D-05 chose a single `laval` slug, so follow the *nav-route* (shared-path) pattern in `sitemap.ts` instead.

### Established Patterns
- **Single dictionary source for schema + visible copy** — the FAQ route proves it; replicate for answer-first blocks and Laval FAQ so schema can never drift from rendered text.
- **Curl-of-raw-HTML verification before merge** — every success criterion is a `curl | grep`; tests/verification must assert on SSR output, not client render.
- **TDD discipline carried from Phase 1** — each Truth → a failing test first.

### Integration Points
- `/llms.txt` route → `STANDALONE_PATHS` (proxy) + `proxy.test.ts` (the one place the build won't protect you).
- New `/laval` route → `sitemap.ts` entry + nav/secondaryNav consideration in `site.ts`.
- Service `[slug]` page → add `faqPageGraph` call alongside existing `serviceGraph`/`breadcrumbGraph`.

</code_context>

<specifics>
## Specific Ideas

- FAQ topics to cover in the hub: hours, booking, **parking at CF Carrefour Laval**, services offered, pricing, walk-ins.
- Laval page facts: CF Carrefour Laval location, parking, transit access, nearby landmarks.
- llms.txt is a *curated brief* (summary + NAP + services + hours + booking/contact + key-page links), EN-canonical with a pointer that fr/es/ar exist — not a minimal pointer file, not a per-locale index.
- Answer-first voice = factual, NAP-consistent, drafted from existing dictionary tone.

</specifics>

<deferred>
## Deferred Ideas

- **Categorized / sectioned FAQ hub** (grouped Visiting/Services/Booking/Policies with anchors) — out of scope for v1; expand-in-place chosen. Candidate for a content-expansion milestone.
- **Answer-first on legal/utility pages and `/comparisons/[slug]`** — excluded by D-04; revisit only if those pages prove citation-worthy.
- **Per-locale Laval slug** (e.g. `/laval-salon-ongles`) — rejected in favor of single `laval` slug; revisit if local SEO data favors localized slugs.
- **Per-service standalone FAQ pages** — only inline per-service `FAQPage` schema is in scope, not separate routes.

</deferred>

---

*Phase: 2-Content, Schema & Crawl Surface*
*Context gathered: 2026-06-17*
