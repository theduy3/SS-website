# Competitor SEO Benchmarks — Out-of-Market Teardown

> For Sans Souci Ongles & Spa · CF Carrefour Laval · 2026-05-21
> **Companion to** `seo-strategy.md` and `seo-competitor-analysis.md` (local Laval rivals). This doc analyses 4 **out-of-market, best-in-class** nail studios as aspirational benchmarks and extracts only the tactics our existing plan does **not** already cover.

## 1. Purpose & scope

The user supplied 4 high-performing nail studios (all NYC) and asked what to integrate into the SS site. These are **not local competitors** — they're best-practice references. The patterns transfer; the keywords do not (NYC ≠ Laval, English-only ≠ bilingual).

**Locked constraints for this doc:**
- **Only 4 real services** — Manicure ($50), Pedicure ($40), Lash extensions ($70), Waxing ($15). We never claim a technique SS doesn't perform (no "Russian manicure", "Gel-X", "Japanese manicure" as services). Patterns are repurposed onto the real menu.
- **Doc-only deliverable** — recommendations + templates + inline schema for later implementation. No code shipped here.
- **4-locale spread kept** — FR (default) / EN / ES / AR.
- **Deferred (explicitly out of scope, per decision):** technician bios + `Person` schema, press/"as seen in" trust strip, individual `Review` schema. Revisit later.

The 4 net-new tactical deltas this doc adds: **A** on-page comparison tables, **B** H1/title formula, **F** price-range presentation, **G** search-vocabulary lift.

## 2. Benchmark teardown

| Site | What they do well | Transferable to SS? |
|---|---|---|
| **nailfairy.art** (NYC) | H1 = *"Best Russian Manicure & Custom Nail Art Studio in New York City"* (benefit+method+city). Educational block *"Why E-FILE (Dry/Russian) Manicures Are the Gold Standard"*. Rich FAQ. Dual-NAP. Precise technique vocabulary (e-file, structured gel, dry technique). | **Pattern yes** (keyword H1 formula → delta B; "why this is better" educational block → delta A). Method names **no** (not our services). |
| **gildedritual.com** (NYC) | H1 *"Best Russian Manicure & Pedicure in NYC"*. **Tiered, transparent pricing** (Senior/Top Master/Star, $135–$245) **with durations** (1.5 h, 75 min). Service-specific long-form copy. Newsletter "15% off first service". | **Price-range + duration display → delta F.** H1 formula → delta B. (Tier names are their staffing model; SS shows flat prices — present as "from $X".) |
| **naillabnyc.com** (NYC) | Heavy "organic" + ingredient vocabulary in service names ("keratin, jojoba oil, vitamin E"). Repeated "Book Now" (Square). On-sale price anchoring ($59.90 → $57). | **Ingredient/benefit vocabulary → delta G.** CTA density is fine; SS already has a booking widget. *Weakness to avoid: no on-page NAP, no schema.* |
| **bisouny.com** (NYC) | Clean brand design, direct Booker.com booking, social links. | **Little to copy** — thin content, **missing title/meta/NAP/schema**. Serves as a *cautionary* example: SS already beats it decisively on technical SEO. |

## 3. What SS already does as well or better — do NOT rebuild

Confirmed live in this repo (see `src/lib/seo.ts`, `layout.tsx`, `sitemap.ts`):

- **Full schema graph** — `NailSalon` + `WebSite` sitewide, `Service`+`Offer`, `FAQPage`, `BreadcrumbList`, `ImageGallery`, `AggregateRating`. → 3 of the 4 benchmarks (Nail Lab, Gilded, Bisou) have **no detectable schema at all**.
- **Bilingual hreflang** (FR/EN/ES/AR, x-default→fr, localized service slugs). → All 4 benchmarks are English-only.
- **Transparent on-page pricing** — already ahead of Nail Fairy (hides prices behind /services) and Bisou.
- **On-page NAP + geo meta + GeoCoordinates** — Nail Lab and Bisou both fail this.
- **Fast Next.js + `next/image`** — favourable Core Web Vitals vs the WordPress/Squarespace benchmarks.

**Takeaway: SS's technical SEO already exceeds these benchmarks. The gap is content & positioning, addressed by the 4 deltas below.**

## 4. The 4 deltas

### Delta A — On-page comparison / decision tables (highest value)
**Benchmark:** Nail Fairy's *"Why E-FILE manicures are the gold standard"* — a comparison/education block that wins featured snippets and AI citations.
**Current SS plan:** `seo-content-calendar.md` already lists *"Gel vs regular vs dip"* and *"Waxing vs sugaring"* as **prose blog posts**.
**Upgrade:** turn those into **structured comparison pages** — a ✅/⚠️/❌ decision matrix + concise "best for" verdicts + `FAQPage` schema. Comparison tables are quotable by Google AI Overviews / Perplexity and rank for "X vs Y" + "which lasts longest" intent. Templates in §5.
**Fairness:** SS only compares **its own service options** (gel vs dip vs regular polish — all offered within Manicure), never disparages a named competitor.

### Delta B — H1 / title-tag formula (quick win)
**Benchmark:** Gilded & Nail Fairy lead every page with **benefit + method + city** in the H1.
**Current SS plan:** keyword pillars exist (`seo-strategy.md` §5) but no explicit H1 formula; current titles come from `dict.meta.*`.
**Formula (apply across all 4 locales):**

| Page | H1 / `<title>` pattern | Example (FR) | Example (EN) |
|---|---|---|---|
| Home | `[Salon] — [top service] à Carrefour Laval` | Sans Souci — Manucure & Pédicure à Carrefour Laval | Sans Souci — Nail Salon at Carrefour Laval |
| Service: Manicure | `Manucure à Laval — gel, pose, vernis · [Salon]` | Manucure gel & pose à Laval · Carrefour Laval | Gel Manicure in Laval · Carrefour Laval |
| Service: Lash | `Extension de cils à Laval — 2D · 3D · Hybride` | Extension de cils Laval — 2D, 3D, Hybride | Lash Extensions in Laval — 2D, 3D, Hybrid |
| Comparison | `[A] vs [B] — [decision question]` | Gel vs Dip vs Vernis : laquelle dure le plus longtemps ? | Gel vs Dip vs Regular: which manicure lasts longest? |

Keep titles ≤ 60 chars, descriptions ≤ 155, primary keyword first, "Laval"/"Carrefour Laval" present. ES/AR mirror the FR structure with translated terms.

### Delta F — Price-range presentation + `Offer` precision
**Benchmark:** Gilded shows **price + duration** per service; price anchoring builds intent.
**Current SS:** flat single prices ($50/$40/$70/$15), `Offer` with single `price`.
**Upgrade (truthful):** present as **"à partir de 50 $ · ~45 min"** ("from $50 · ~45 min") where add-ons create a real range, and add **duration**. In `serviceGraph()`'s `Offer`, prefer `priceSpecification` with `minPrice` (or `lowPrice` on an `AggregateOffer`) when a service has add-on tiers, so Google can render a price range. Keep `price` for single-price services. Snippet in §6.

### Delta G — Search-vocabulary lift
**Benchmark:** Nail Fairy ("e-file", "structured gel") & Nail Lab ("keratin, jojoba oil, vitamin E") rank on precise technique/ingredient nouns.
**Current SS:** generic service copy.
**Upgrade:** weave the **truthful, searched** nouns SS can own into `serviceDetails.intro / whyUs / included` and meta:

| Service | Add these searched terms (only if true) |
|---|---|
| Manicure | *gel / shellac, vernis semi-permanent, poudre trempée (dip powder), pose d'ongles, soin des cuticules, 1000+ couleurs* |
| Pedicure | *pédicure spa, paraffine, soin des callosités, vernis gel* |
| Lash | *2D / 3D / volume russe (as a lash style, truthful), hybride, remplissage (refill), pose de cils* |
| Waxing | *épilation à la cire, sourcils, lèvre, jambes complètes, aisselles* |

Do **not** introduce a term for a service SS doesn't perform. Verify each with the salon before publishing.

## 5. Comparison-page templates (delta A)

Three pages, each ~1,200–1,500 words/locale, shipped FR+EN (ES/AR per existing locale policy). Each lives under the relevant service hub and links **up** to the service page and **out** to the booking CTA. Emits `FAQPage` + `BreadcrumbList`.

### 5.1 "Gel vs Dip vs Vernis régulier" (Manicure)
- **Title/H1 (FR):** *Gel vs Dip vs Vernis régulier : quelle manucure dure le plus longtemps ? · Laval*
- **Title/H1 (EN):** *Gel vs Dip vs Regular Manicure: Which Lasts Longest? · Laval*
- **Comparison matrix:**

| Critère | Vernis régulier | Vernis gel / semi-permanent | Poudre trempée (dip) |
|---|:--:|:--:|:--:|
| Tenue | ⚠️ 2–4 j | ✅ 2–3 sem | ✅ 3–4 sem |
| Temps de séchage | ⚠️ à l'air | ✅ lampe UV | ✅ rapide |
| Brillance | ✅ | ✅ | ✅ |
| Retrait | ✅ simple | ⚠️ trempage | ⚠️ trempage |
| Idéal pour | événement express | usage quotidien | longue tenue |

- **Outline:** intro (decision framing + local) → matrix → 150-word verdict per option ("best for…") → "what we use at Sans Souci" → FAQ (3–4 Q: *combien de temps ça dure, est-ce dommageable, retrait, prix*) → booking + click-to-call CTA.

### 5.2 "Cils 2D vs 3D vs Hybride" (Lash)
- **Title/H1 (FR):** *Cils 2D, 3D ou Hybride : comment choisir ? · Laval*
- **Matrix dimensions:** volume/drama, naturel, durée de pose, remplissage, idéal pour. Same ✅/⚠️/❌ format.

### 5.3 "Épilation à la cire vs sucre (sugaring)" (Waxing)
- **Title/H1 (FR):** *Cire vs sucre (sugaring) : quelle épilation choisir ? · Laval*
- **Matrix dimensions:** douleur, durée du résultat, peaux sensibles, zones, repousse. Note honestly which method SS actually offers; if SS only does wax, frame as "wax vs sugaring — pourquoi nous utilisons la cire" (educational, still ranks, stays truthful).

**Fairness rules (all 3):** only truthful claims about SS's own service options; cite no competitor by name; include "dernière mise à jour [date]"; link to the parent service page.

## 6. Inline schema snippets (for later implementation)

Slot into existing builders in `src/lib/seo.ts` — do not invent a new rendering path; reuse `<JsonLd>`.

### `FAQPage` for comparison pages — reuse `faqPageGraph()` (seo.ts:235)
```ts
// In the comparison page, pass the page's Q&A array straight into the existing builder:
faqPageGraph([
  { q: "Quelle manucure dure le plus longtemps ?", a: "La poudre trempée tient 3–4 semaines…" },
  { q: "Le gel abîme-t-il les ongles ?", a: "Appliqué et retiré correctement, non…" },
])
// Render via <JsonLd data={faqPageGraph(items)} /> alongside breadcrumbGraph()
```

### `Offer` price range (delta F) — extend `serviceGraph()` (seo.ts:218)
```jsonc
// For a service with add-on tiers, replace the single Offer with an AggregateOffer:
"offers": {
  "@type": "AggregateOffer",
  "priceCurrency": "CAD",
  "lowPrice": "50",
  "highPrice": "85",          // only if a real higher tier/add-on exists
  "offerCount": 2,
  "availability": "https://schema.org/InStock"
}
// Single-price services keep the existing { "@type": "Offer", "price": "40", ... }.
// Add duration to the Service node when known:
"serviceOutput": "…", "estimatedDuration": "PT45M"   // ISO-8601 duration
```

Validate every snippet in Google Rich Results Test before shipping.

## 7. Keyword map (comparison + decision intent)

`[N]` = net-new vs `seo-strategy.md` §5 · others reinforce existing pillars.

| Service | FR | EN | ES | AR |
|---|---|---|---|---|
| Manicure | gel vs vernis régulier `[N]`, poudre trempée laval `[N]`, manucure qui dure longtemps `[N]` | gel vs dip manicure `[N]`, longest lasting manicure `[N]`, gel nails laval | manicura gel vs normal `[N]` | مانيكير جل لافال `[N]` |
| Pedicure | pédicure spa laval, pédicure paraffine `[N]` | spa pedicure laval, paraffin pedicure `[N]` | pedicura spa laval | باديكير سبا لافال |
| Lash | cils 2D 3D hybride `[N]`, durée extension de cils `[N]` | how long do lash extensions last `[N]`, 2D vs 3D lashes `[N]` | duración extensiones de pestañas `[N]` | رموش 2D 3D لافال `[N]` |
| Waxing | cire vs sucre épilation `[N]`, épilation sourcils laval | waxing vs sugaring `[N]`, brow wax laval | cera vs azúcar depilación `[N]` | إزالة الشعر بالشمع لافال |

Decision/comparison terms (`vs`, "which lasts longest", "how long does X last") are the **net-new** layer; head terms ("manucure laval") are already covered by the service pages.

## 8. Prioritized roadmap (slots into existing phases)

Maps onto the Phase 1–4 cadence in `seo-strategy.md` / `seo-content-calendar.md` — **not** a competing timeline.

| Delta | Impact | Effort | Slot |
|---|---|---|---|
| **B** H1/title formula | High (CTR + ranking) | Low — edit `dict.meta.*` + page H1s | **Phase 1**, alongside the 4 service pages |
| **G** vocabulary lift | High (long-tail) | Low — edit `serviceDetails.*` copy | **Phase 1**, same pass as service-page content |
| **A** comparison pages | Highest (snippets + AI) | Medium — 3 new pages × locales | **Phase 2/3**, upgrades the planned "Gel vs dip" / "wax vs sugaring" blog posts |
| **F** price-range + `Offer` | Medium (rich result) | Low–Med — schema + display, only where a real range exists | **Phase 2**, with service-page polish |

Quick wins (B, G) ride along with Phase-1 work already scheduled — near-zero marginal effort.

## 9. Cross-references & fairness footer

- Companion docs: `seo-strategy.md` · `seo-competitor-analysis.md` (local rivals) · `seo-content-calendar.md` · `seo-site-structure.md` · `seo-implementation-roadmap.md` · `spec-seo-content.md`.
- **Market caveat:** all 4 benchmarks are NYC, English-only. Their *patterns* (keyword-led H1, comparison content, price transparency, technique vocabulary) transfer; their *keywords* ("Russian manicure NYC") do not — everything localized to Laval/Carrefour Laval and the 4-locale set.
- **Accuracy/fairness:** no recommendation here introduces a service Sans Souci does not perform; comparison content covers only SS's own service options and never names or disparages a competitor; verify every added technique/ingredient term with the salon before publishing.
- **Deferred for a later pass:** technician bios + `Person` schema, press/trust strip, individual `Review` schema.

> Sources analysed 2026-05-21: nailfairy.art · naillabnyc.com · gildedritual.com · bisouny.com
