# GEO Analysis — Sans Souci Ongles & Spa

**Domain:** onglessanssouci.com
**Analyzed:** 2026-06-28
**Method:** Static source audit (Next.js App Router) + GEO criteria (Feb 2026)
**Scope:** AI Overviews · ChatGPT search · Perplexity · Bing Copilot

---

## 1. GEO Readiness Score: **79 / 100**

This site is already well above the median local-business baseline. The technical
foundation (server-side rendering, AI-crawler allow-list, dual `llms.txt`, agent
`.md` twins, comprehensive Schema.org) is essentially complete. The remaining gap
is **off-site entity authority** (brand mentions, third-party presence) plus a
small set of **on-site factual-consistency defects** that actively undermine
citation trust.

| Criterion | Weight | Score | Notes |
|-----------|:-----:|:-----:|-------|
| Citability | 25% | 21/25 | Answer-first blocks + FAQ are textbook; price conflicts cost points |
| Structural Readability | 20% | 18/20 | Question headings, short paragraphs, comparison tables, FAQ |
| Multi-Modal Content | 15% | 9/15 | Images + ImageGallery schema; no video, no tools/calculators |
| Authority & Brand | 20% | 12/20 | NAP + schema solid; no Person/author, thin off-site entity presence |
| Technical Accessibility | 20% | 19/20 | SSR, AI bots allowed, llms.txt, .md twins, hreflang, sitemap |
| **Total** | 100% | **79** | |

---

## 2. Platform Breakdown

| Platform | Score | Verdict |
|----------|:-----:|---------|
| **Google AI Overviews** | 82/100 | Strongest. Schema + SSR + answer-first content align with AIO selection. Primary remaining lever is traditional ranking (top-10) and review velocity. |
| **ChatGPT Search** | 70/100 | Gated by entity presence. ChatGPT leans Wikipedia (47.9%) + Reddit (11.3%); the brand has neither. NAP/llms.txt help but won't fully substitute. |
| **Perplexity** | 68/100 | Weakest. Perplexity cites Reddit ~46.7%; zero community footprint. Excellent on-site structure is necessary but not sufficient here. |
| **Bing Copilot** | 75/100 | SSR + schema + sitemap are Bing-friendly. Add IndexNow ping for faster freshness propagation. |

---

## 3. AI Crawler Access Status

Source: `src/app/robots.ts` (dynamic `MetadataRoute.Robots`).

**Explicitly allowed** (per-agent `Allow: /` blocks):

| Crawler | Owner | Type | Status |
|---------|-------|------|:------:|
| GPTBot | OpenAI | Trainer/crawler | ✅ Allowed |
| ClaudeBot | Anthropic | Crawler | ✅ Allowed |
| Google-Extended | Google | Trainer | ✅ Allowed |
| ChatGPT-User | OpenAI | Answer-time fetch | ✅ Allowed |
| OAI-SearchBot | OpenAI | Search index | ✅ Allowed |
| PerplexityBot | Perplexity | Crawler | ✅ Allowed |
| Perplexity-User | Perplexity | Answer-time fetch | ✅ Allowed |
| Claude-User | Anthropic | Answer-time fetch | ✅ Allowed |
| `*` (wildcard) | — | All others | ✅ Allowed, `/api/` disallowed |

**Verdict:** ✅ Best-practice. Both trainers and the high-leverage answer-time
fetchers are named. `/api/` correctly kept private. No action needed.

> Minor: `Bytespider`, `cohere-ai`, and `CCBot` are covered by the wildcard
> `Allow: /` (i.e. permitted). If you want to deny training-only crawlers while
> keeping search visibility, add explicit `disallow` blocks for them — optional.

---

## 4. llms.txt Status

**Two implementations present — both valid, serving different consumers:**

1. **`/llms.txt`** — dynamic route (`src/app/llms.txt/route.ts`, `force-static`).
   Business brief for AI agents: About, NAP, services, hours, booking, key
   pages, comparisons, guides, and a full **`.md` machine-readable page index**.
2. **`public/llms.txt`** — static fallback. Standard llms.txt format with
   multilingual notes (FR default, EN/ES/AR).

**Verdict:** ✅ Above standard. The `.md` twin index inside the dynamic file is a
genuinely advanced touch — it hands AI agents clean, JS-free content URLs.

> ⚠️ **Defect — two files can drift.** Having both a dynamic route AND a static
> `public/llms.txt` means a stale static copy could contradict the live route.
> Either delete `public/llms.txt` (the dynamic route wins at `/llms.txt`) or add
> a parity test. See finding GEO-A below.

---

## 5. Brand Mention Analysis

Brand mentions correlate **3× more strongly with AI visibility than backlinks**
(Ahrefs, Dec 2025). This is the site's single biggest growth lever.

| Platform | Presence | Linked in schema `sameAs`? |
|----------|:--------:|:--------------------------:|
| Instagram | ✅ `sans.souci.cflaval` | ✅ Yes |
| Facebook | ✅ `sans.souci.cflaval` | ✅ Yes |
| Google Business Profile | ⚠️ Implied (reviews fetched) | ❌ Not in `sameAs` |
| Wikipedia / Wikidata | ❌ None | ❌ |
| Reddit | ❌ None | ❌ |
| YouTube | ❌ None | ❌ (YouTube mentions ≈ 0.737 corr — strongest single signal) |
| LinkedIn | ❌ None | ❌ |

**Verdict:** ⚠️ Thinnest area. On-site signals are maxed; off-site entity
authority is near-zero beyond IG/FB. This caps ChatGPT/Perplexity ceiling.

**Highest-leverage actions:**
- Add the **Google Business Profile URL to `socialProfiles`** (`src/lib/site.ts`)
  so it flows into schema `sameAs` — connects the website entity to the GBP entity.
- Seed **Reddit** presence in r/Laval / r/montreal nail-salon threads (authentic,
  value-first — not spam). Perplexity weights this heavily.
- Publish 3–5 short **YouTube** clips (service walk-throughs, salon tour) — even
  low view counts create the strongest measured citation correlation.

---

## 6. Passage-Level Citability

**Strong — this is the site's best feature.** Guide/comparison content follows an
answer-first template that maps directly onto how AI engines extract passages.

Example (`dict.guides['manicure-cost-laval']`):
- **Question H1:** "How Much Does a Manicure Cost in Laval?"
- **`answer` block (~45 words, self-contained):** "A classic manicure at Sans
  Souci Ongles & Spa in Laval starts at $30, and a gel manicure starts at $40…
  Call (450) 505-6450 for an exact quote." → direct answer in first 40–60 words ✅
- **Question-style H2s:** "What changes the price", "Classic vs gel — which is worth it"
- **FAQ** with repeated Q&A (also emitted as `FAQPage` schema)
- Specific facts: prices, phone, duration ("two to three weeks"), location landmark

Each guide is ~350 words split into ~50–90-word self-contained blocks — slightly
under the 134–167-word citation sweet spot per block, but the answer-first
structure compensates.

> ✅ **Resolved 2026-06-28 (GEO-B).** The conflict below was reconciled — all
> sources now state manicure from $50 (up to $100) and waxing from $15. Kept for
> the record.
>
> 🔴 **Critical defect — conflicting price facts.** AI engines cross-check facts;
> contradictions suppress citation. Three sources disagree on manicure price:
> - `src/lib/services.ts` → manicure `price: 50` → emits `Offer` "from $50"
> - `/llms.txt` route → "Manicures (from $50 CAD)"
> - Guide prose `answer` → "classic manicure starts at **$30**, gel starts at **$40**"
>
> A crawler reading the Service schema ($50), the llms.txt ($50), and the guide
> ($30/$40) sees three different manicure prices for the same business. **Pick one
> source of truth and reconcile.** See finding GEO-B.
>
> Also: waxing is `price: 15` in `services.ts` but the `/llms.txt` route hardcodes
> "Waxing (from $30 CAD)" — another drift (GEO-B).

---

## 7. Server-Side Rendering Check

**AI crawlers do NOT execute JavaScript.** Content must be in the initial HTML.

- ✅ Next.js App Router **Server Components** — pages render server-side.
- ✅ JSON-LD inlined server-side via `<JsonLd>` (`dangerouslySetInnerHTML`),
  visible without JS. Correctly escapes `<` → `<` (XSS-safe).
- ✅ `.md` twins (`/en/services/manicure/index.md`, etc.) serve pure text — the
  ideal JS-free surface for agents.
- ✅ Metadata (canonical, hreflang, OpenGraph) emitted via the `Metadata` API,
  server-rendered.
- ⚠️ Interactive widgets (BookingWidget, QueueWidget, CheckinWidget, popups) are
  client components — fine, as the **citable content** (prose, NAP, prices, FAQ)
  is all SSR. No action needed; just keep money-content out of client-only branches.

**Verdict:** ✅ Excellent. No JavaScript-dependency risk to citable content.

---

## 8. Top 5 Highest-Impact Changes

1. **🔴 Reconcile price facts across schema, llms.txt, and guide prose** (GEO-B).
   Single source of truth = `services.ts`. Conflicting facts are the one thing
   actively *hurting* an otherwise strong citability profile.
2. **🟠 Build off-site entity presence** — Reddit + YouTube + Google Business
   Profile in `sameAs`. This is the gate on ChatGPT/Perplexity (Sections 2, 5).
3. **🟠 Add author / E-E-A-T signals** — a named technician/owner with credentials
   (`Person` schema + byline on guides) raises Authority from 12→~16/20.
4. **🟡 Resolve the dual-llms.txt drift risk** (GEO-A) — delete the static copy or
   add a parity test so the two never contradict.
5. **🟡 Add multi-modal depth** — embed a short video or a price/duration
   reference table per service page (multi-modal content sees +156% selection).

---

## 9. Schema Recommendations

**Already implemented (strong coverage):** `NailSalon` (LocalBusiness) +
`WebSite` graph, `Service` / `ItemList`, `FAQPage`, `ImageGallery` + `ImageObject`,
`Product` (comparisons), `Review` (gated), `Article` (guides), `BreadcrumbList`.
Ratings are **honestly gated** on `reviewsFetchedAt` — never asserts unverified
numbers. Entities normalized via `@id` linking. This is exemplary.

**Recommended additions:**
- **`Person` schema** for a lead technician/owner, linked from `Article` guides as
  `author`, with `sameAs` to LinkedIn/Instagram. Closes the biggest Authority gap.
- **`@id` on `Service` nodes** so guides/comparisons can reference a specific
  service entity (currently Services carry no `@id`).
- **`OfferCatalog`** under the `NailSalon` node to expose the full priced menu
  as one machine-readable list (complements per-service `Offer`s).
- **`potentialAction` → `ReserveAction`** on the business node pointing at the
  booking URL — signals "bookable" to AI assistants.
- **`hasMap`** + `GeoCoordinates` (geo already present) — add the Google Maps URL.

---

## 10. Content Reformatting Suggestions

The content template is already strong. Targeted upgrades:

1. **Lengthen answer blocks toward 134–167 words.** Guide `answer` fields run
   ~45 words. Keep the first sentence as the direct answer, then add 2–3 sentences
   of self-contained context (what's included, typical duration, what affects it)
   so the *whole block* is independently citable at the optimal length.
2. **Add a comparison/spec table to each service page.** Service pages lean on
   prose; a `finish · duration · starting price · best for` table is highly
   extractable (tables boost selection). `ComparisonTable` component already exists.
3. **Surface `dateModified` in visible content**, not just sitemap/`.md`
   frontmatter. A visible "Updated June 2026" line is an AI freshness signal.
4. **Add a definitional opener** to comparison pages: lead with "Gel polish is…"
   / "Sugaring is…" (the "X is…" pattern AI engines extract for definitions).
5. **Expand FAQ coverage** with long-tail local-intent questions ("Do you take
   walk-ins?", "Is there parking at Carrefour Laval?", "Do you do nail art?") —
   each becomes a `FAQPage` Q&A and a citable passage.

---

## Findings Register

| ID | Severity | Finding | Fix |
|----|:--------:|---------|-----|
| GEO-B | ✅ Resolved | ~~Manicure price conflicts: schema/llms.txt say $50, guide prose says $30/$40; waxing $15 vs $30~~ Fixed 2026-06-28: `services.ts` adopted as single source. Guide `manicure-cost-laval` reconciled to "from $50, up to $100" across en/fr/es/ar; `/llms.txt` waxing drift $30→$15. 209/209 tests pass. | Done |
| GEO-A | ✅ Resolved | ~~Dynamic `/llms.txt` route + static `public/llms.txt` can drift~~ Fixed 2026-06-28: live `/llms.txt` was being **shadowed** by the static `public/llms.txt` (thinner — no prices, no `.md` index). Deleted the static file so the richer dynamic route (`STANDALONE_PATHS`-wired) serves. | Done |
| GEO-C | 🟠 High | No off-site entity presence (Wikipedia/Reddit/YouTube/LinkedIn) | Seed Reddit/YouTube; add GBP to `sameAs` |
| GEO-D | 🟠 High | No author/`Person` schema → weak E-E-A-T | Add `Person` + byline on guides |
| GEO-E | 🟡 Medium | Answer blocks under optimal citation length | Expand to 134–167 words |
| GEO-F | 🟡 Medium | Service pages lack extractable tables | Add per-service spec table |

---

## Strengths Worth Preserving

- **Robots AI allow-list** names answer-time fetchers, not just trainers — rare and correct.
- **Dual llms.txt with a `.md` twin index** — agent-first content delivery.
- **Honest rating gating** (`reviewsFetchedAt`) — no fabricated `AggregateRating`.
- **Dark-referrer recovery** (GEO-02, shipped) — captures AI-referred traffic that
  arrives with stripped referrers; keep monitoring `dark_referrals` to measure GEO ROI.
- **Full hreflang + 4-locale** content — multiplies citable surface across languages.
