# SEO Action Plan — Sans Souci Ongles & Spa

Prioritized fixes from the 2026-06-05 audit. Health score **90/100 (A-)**.
Site is already strong — this is polish to push toward 97+.

Priority key: **Critical** = blocks indexing/penalty · **High** = ranking impact ·
**Medium** = optimization · **Low** = nice-to-have.

---

## Critical
*None.* No indexing blockers, no penalties, no broken canonicals.

## High

### H1 — Add Review / AggregateRating schema
- **Why:** Meta + `/reviews` page advertise "4.9★" but it's never structured → no star rich results.
- **Where (this repo):** the JSON-LD builder for the NailSalon node (and/or a dedicated node on `/reviews`).
- **Do:** add `aggregateRating` (`@type": "AggregateRating"`, `ratingValue`, `reviewCount`/`bestRating`) and a few `Review` items, sourced from reviews actually rendered on-page (Google policy requires on-page visibility). Localize per locale.
- **Validate:** Google Rich Results Test + Schema.org validator.

### H2 — Fix non-descriptive link (SEO `link-text` audit)
- **Why:** drops Lighthouse SEO to 92; weak anchor signals.
- **Do:** give the flagged icon/empty link visible text or `aria-label`.

## Medium

### M1 — Accessibility: prohibited ARIA on star ratings (10 elements)
- **Issue:** `<div aria-label="5 / 5">` — a bare `<div>` (no role) can't carry `aria-label`.
- **Fix:** add `role="img"` to each star-rating wrapper (keeps the label valid). One component change fixes all 10.
- **Bonus:** resolves the `agent-accessibility-tree` malformed-tree audit too.

### M2 — Language switcher name mismatch
- **Issue:** button shows visible "EN" but `aria-label="Change language"` → `label-content-name-mismatch`.
- **Fix:** include the visible code in the accessible name (e.g. `aria-label="Change language (EN)"`) or drop the override so visible text is the name.

### M3 — LCP render delay (892 ms of 982 ms)
- **Fix:** mark the hero/LCP image `priority` in Next `<Image>` (disables lazy, adds preload), ensure it's discoverable in initial HTML. Re-measure target render delay < 300 ms.

### M4 — Enable Brotli compression
- **Issue:** `Accept-Encoding: br` returns uncompressed; only gzip negotiated.
- **Fix:** enable Brotli at the CDN/reverse proxy (Dokploy/nginx). ~15-20% smaller document on top of gzip.

## Low

### L1 — favicon.ico 404
- Add `app/icon.*` / `app/favicon.ico` (App Router metadata) so `/favicon.ico` resolves 200.

### L2 — Add llms.txt (GEO)
- Publish `/llms.txt` summarizing the business, services, hours, and key page URLs for AI engines.

### L3 — Security hardening (non-SEO)
- Add `Content-Security-Policy`; remove/obscure `X-Powered-By: Next.js`.

### L4 — Default-locale root redirect
- `/ → /fr` is `307`; consider `308` (permanent) for the canonical default-locale root.

### L5 — Expand informational/GEO content
- Add a guides/blog hub (aftercare, trends, pricing explainers) to widen informational query coverage and AI citation surface. Link from services.

### L6 — Entity grounding
- Add `hasMap` / Google Business Profile URL to `sameAs`; surface owner/founder + years-in-business as structured E-E-A-T signals.

---

## Suggested sequence
1. **This week:** H1 (review schema), H2, M1, M2 — mostly one component/JSON-LD builder each, big A11y+rich-result payoff.
2. **Next:** M3 (LCP priority), M4 (Brotli) — perf headroom before traffic grows.
3. **Backlog:** L1-L6.

---

## Implementation status (2026-06-05)

Code fixes applied this session (tsc + eslint clean):
- ✅ **M1** — `role="img"` added to the 3 star-rating wrappers (`Testimonials.tsx`, home `page.tsx`, `reviews/page.tsx`). Fixes `aria-prohibited-attr` + `agent-accessibility-tree`.
- ✅ **M2** — `LocaleSwitch` button accessible name now includes the visible locale code (`"EN — change language"`). Fixes `label-content-name-mismatch`.
- ✅ **H2 / link-text** — `Button` gained an optional `ariaLabel`; the home "Learn more" → /about link now has a descriptive, localized accessible name (`learnMoreAria` added to all 4 dictionaries).
- ⚠️ **L1 (false positive)** — favicon was already correct. `src/app/icon.png` (250×250) is tracked and the live site already serves `<link rel="icon" href="/icon.png">` + apple-touch-icon. The `/favicon.ico` 404 is normal App Router behaviour (it serves `/icon.png`, not `/favicon.ico`). No change made.
- ✅ **L2** — `public/llms.txt` published.
- ✅ **L3 (partial)** — `poweredByHeader: false` set; `X-Powered-By` header removed. (CSP still intentionally deferred — see code note re: booking widget origin.)

Re-scoped after reading the source (audit assumptions corrected):
- ⚠️ **H1 (review schema)** — NOT a code gap. `lib/seo.ts` already emits `AggregateRating`, gated behind `reviewsFetchedAt` in `data/google-reviews.json` (currently `null`, reviews `[]`). It is **deliberately** omitted until a real Google fetch runs (`scripts/fetch-google-reviews.mjs`) so the markup stays honest. **Action is ops, not code:** run the fetch with live Business Profile data; schema then appears automatically. Do NOT hardcode the 4.9/120 placeholder.
- ⚠️ **M3 (LCP render delay)** — hero `<Image>` already has `priority`. The residual 892 ms render-delay is the `Reveal` fade-in (framer-motion `opacity 0→1`) wrapping the above-fold hero. Removing the reveal on the hero would improve LCP but changes the brand animation — **left for an explicit design decision**, not silently altered.
- ⚠️ **M4 (Brotli)** — infrastructure, not in the Next codebase. Enable at the Dokploy/nginx reverse proxy; cannot be fixed in-repo.
- ℹ️ **L4** — `/ → /fr` 307 is the i18n proxy default; out of repo scope.

## Re-measure after fixes
- Google Rich Results Test (review stars now eligible).
- Lighthouse mobile (expect A11y → 100, SEO → 100).
- Performance trace (LCP render delay ↓).
- Recheck Brotli via `curl -H 'Accept-Encoding: br' -I`.
