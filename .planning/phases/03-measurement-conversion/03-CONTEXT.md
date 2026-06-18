# Phase 3: Measurement & Conversion - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Instrument the now-citable site so AI-referred traffic is measured and converted, by:
1. Installing **GA4** (env-var measurement ID, `next/script`) with **Consent Mode v2** (Law 25) and a custom **AI-referrer channel group** configured before any new page ships (no backfill).
2. Firing **conversion events** for phone-call click, contact-form submit, and booking-CTA click.
3. Adding an above-fold **trust band** (rating + review count + "Since 2024") and a **sticky mobile Call+Book bar** on key pages.
4. Capturing **web-vitals RUM** (LCP/INP/CLS) and confirming key pages hit "good" thresholds with no Framer-Motion double-load regression.

Scope = MEAS-01..04. This is **configuration + instrumentation + a small amount of new UI** on the existing SSR site — not new content or schema. No new un-localized routes are added (analytics is a script/provider; RUM is client-side), so the `STANDALONE_PATHS` ↔ proxy gotcha does **not** apply this phase.

</domain>

<decisions>
## Implementation Decisions

### GA4 Analytics & Consent (MEAS-01)
- **D-01:** Measurement ID via **`process.env.NEXT_PUBLIC_GA_ID`**, injected with `next/script`. Tag **no-ops if unset** (safe build). User creates the GA4 property and sets the ID in **Dokploy** (matches runtime-secret convention; ID stays out of git).
- **D-02:** **Google Consent Mode v2**, `analytics_storage` **default-denied**. A **minimal Accept/Decline bottom-bar** flips it on opt-in. Banner copy in **all 4 locales (en/fr/es/ar)** via the dictionary single-source pattern, **RTL-aware**. **Decline keeps storage denied** (no granular toggles — analytics-only, no ad/remarketing).
- **D-03:** AI-referrer capture = **GA4 custom channel-group regex only**. Claude **drafts the regex** (ChatGPT, Perplexity, Claude, Gemini, Copilot source/referrer patterns); **user pastes it into the GA4 console** (Claude cannot reach GA4 admin). **No code-side referrer tagging.** Channel **must be configured before the first new page goes live** — GA4 channel groups do not backfill.

### Conversion Events (MEAS-02)
- **D-04:** Event naming = **GA4 recommended + custom mix**: `generate_lead` (contact-form success), `phone_click`, `book_cta_click`.
- **D-05:** Booking tracked as **click-intent only** (`book_cta_click` on the Book button → `/appointments`). **Completion is unmeasured** — booking finishes inside the **cross-domain SalonX widget** (`app.onglessanssouci.com`). No SalonX dependency; event name reflects *intent*, not confirmed booking (don't misread the GA4 funnel as completed reservations).
- **D-06:** Hooks live at **component level** — instrument the phone `tel:` link, `Button` (book), and `ContactForm` once; events fire wherever those render (DRY, single-source; no per-page wiring).

### Sticky CTA & Trust Signals (MEAS-03)
- **D-07:** New **sticky-bottom, mobile-only bar** with **Call + Book**. RTL-aware; coexists with the existing sticky-**top** `Header`; z-index **below** popup/modal layers.
- **D-08:** Above-fold trust band = **rating + review count** (from `site.reviews`, Google data, gated on live data per the SCHEMA-03 `reviewsFetchedAt` pattern) as the **primary** signal; **"Since 2024"** as a **secondary** marker. Add **`established: 2024`** to `src/lib/site.ts`; render a **static "Since 2024"** string (no dynamic `Date()`). ⚠ Years-in-business is a **thin** signal for a 2024 salon — rating/reviewCount carry credibility; hierarchy = **rating prominent, "Since 2024" muted**.
- **D-09:** Sticky CTA + trust scope = **key pages only** (home, services index, `/services/[slug]`, FAQ hub, `/laval`); **always visible** (not hide-on-scroll). Matches success-criterion-4 page set.

### CWV / web-vitals RUM (MEAS-04)
- **D-10:** Install **`web-vitals`**; send **LCP/INP/CLS as GA4 `web_vitals` events** (metric name + value + rating). **Consent-gated** (same Law 25 gate as other analytics — fires only after opt-in). No new infra/endpoint.
- **D-11:** Framer-Motion double-load = **evidence-first**: add **`@next/bundle-analyzer`** behind `ANALYZE=true`, inspect server/client bundles. **Refactor** import / `"use client"` boundaries **only if duplication is found**; if clean, just lock the gate (no speculative refactor — Rule 3).
- **D-12:** CWV "good" target scope = **key pages only** (same set as D-09).

### Claude's Discretion
- GA4 event **payload/param shapes** beyond the chosen event names.
- Consent-state **storage mechanism** (cookie vs localStorage) — pick an SSR-safe approach that survives reloads.
- Exact **channel-group regex** patterns (Claude drafts; user pastes into GA4).
- `bundle-analyzer` script/CI wiring.
- Sticky-bar styling within the existing design system (`Button.tsx`, espresso/cream palette).
- Which events to flag as GA4 **"key events" (conversions)** in the console — Claude provides the recommended list.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase contract & requirements
- `.planning/ROADMAP.md` § "Phase 3: Measurement & Conversion" — goal + 4 success criteria (GA4 Realtime / event-verification + CWV + ANALYZE-build bar)
- `.planning/REQUIREMENTS.md` — MEAS-01, MEAS-02, MEAS-03, MEAS-04
- `.planning/PROJECT.md` § "Active → Measurement + conversion" / "Context" / "Constraints" — Law 25, no-backfill, SSR rule, Dokploy runtime secrets, "No analytics today"

### Prior decisions to carry forward (do not re-litigate)
- `.planning/phases/02-content-schema-crawl-surface/02-CONTEXT.md` — lead/visible content stays **out of Framer `<Reveal>`** (opacity:0 hides from crawlers); dictionary single-source discipline; the key-page set
- `.planning/phases/01-foundation-prerequisites/01-CONTEXT.md` — `src/lib/site.ts` = NAP/identity source of truth

### Existing code to reuse / extend
- `src/lib/site.ts` — NAP + `site.reviews` (ratingValue/reviewCount), `site.booking` (`/appointments`), `site.phoneHref`; **ADD `established: 2024`**
- `src/data/google-reviews.json` — aggregate rating/count source; honor the `reviewsFetchedAt` live-data gate (SCHEMA-03 pattern in `src/lib/seo.ts`)
- `src/components/Button.tsx` — CTA primitive (reuse for sticky bar)
- `src/components/Header.tsx` — existing **sticky-top** pattern + book CTA reference
- `src/components/ContactForm.tsx` — `status === "success"` is the `generate_lead` hook point
- `src/app/[lang]/appointments/page.tsx` + `src/components/BookingWidget.tsx` — the cross-domain SalonX booking target (why completion is unmeasurable)
- `src/dictionaries/{en,fr,es,ar}.json` — consent-banner + trust-band copy (4-locale single-source)
- Root layout (`src/app/layout.tsx`) — GA4 `next/script` + Consent provider + banner mount point; web-vitals reporter mount

### Crawl-coupling note
- Project memory `standalone-route-proxy-coupling` — **N/A this phase**: no new un-localized route is added. Recorded here so the planner doesn't re-raise it.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Button.tsx` + espresso/cream palette: the sticky Call+Book bar reuses these primitives — no new button system.
- `Header.tsx`: proven `sticky` positioning pattern + `site.booking` href to mirror for the bottom bar.
- `ContactForm.tsx`: already has a clean `success` state — drop the `generate_lead` event there with zero refactor.
- `site.reviews` (ratingValue/reviewCount) + `google-reviews.json`: trust-band data already exists; only `established: 2024` is new.

### Established Patterns
- **Dictionary single-source** (Phase 2 D-01/D-02): consent-banner copy and any visible trust text go through the dictionary in all 4 locales — never hardcode.
- **Live-data gate** (`reviewsFetchedAt`, SCHEMA-03): show the rating only when live Google data is present; mirror this so the trust band degrades gracefully.
- **Crawler visibility** (Phase 2 pitfall): trust text + sticky CTA must be in SSR HTML / not hidden behind `opacity:0` motion; static "Since 2024" (no client `Date()`) keeps CLS/INP clean.
- **Component-level instrumentation**: one hook per shared primitive, fires everywhere (D-06).

### Integration Points
- Root layout: GA4 tag + Consent Mode default state + banner provider + web-vitals reporter all mount here.
- Consent opt-in → `gtag('consent','update',...)` → unblocks analytics + the `web_vitals` events.
- `web-vitals` `onLCP/onINP/onCLS` → GA4 `web_vitals` event (consent-gated).
- Sticky bar mounts on key-page layouts/templates only (D-09).

</code_context>

<specifics>
## Specific Ideas

- **Consent Mode v2** specifically (default-denied), not a generic cookie banner — the banner drives `gtag` consent state.
- Trust hierarchy is intentional: **rating prominent, "Since 2024" muted** (new salon — don't lead with age).
- "Since 2024" as an exact **static** string, sourced from `site.established`.
- Conversion naming honesty: `book_cta_click` = intent, not a confirmed reservation.

</specifics>

<deferred>
## Deferred Ideas

- **Cross-domain booking-completion tracking** (GA4 cross-domain linker / SalonX `postMessage`) — needs SalonX cooperation on `app.onglessanssouci.com`; revisit if/when SalonX exposes booking-confirmed hooks. Captures confirmed bookings, not just intent.
- **Code-side AI-referrer tagging** (belt-and-suspenders custom dimension) — declined for v1; revisit only if the GA4 channel-group regex demonstrably drops Perplexity/Copilot sources.

(No scope creep — discussion stayed within MEAS-01..04.)

</deferred>

---

*Phase: 3-Measurement & Conversion*
*Context gathered: 2026-06-18*
