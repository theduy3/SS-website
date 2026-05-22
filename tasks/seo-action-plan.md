# SEO Action Plan — Sans Souci Ongles & Spa

> From audit 2026-05-20 · Health score 77/100 · Prioritized Critical → Low
> Pairs with `tasks/seo-implementation-roadmap.md` (strategic phases).

## 🔴 Critical (fix before/at deploy)

| # | Action | Where | Effect |
|---|---|---|---|
| C1 | Add real GSC + Bing verification codes; submit sitemap | `src/app/[lang]/layout.tsx` `verification` | Unblocks indexing + measurement |
| C2 | Add security headers (HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP) | `next.config.ts` `headers()` | Best-practice + trust; HSTS needs HTTPS |

> Note: these are "critical" for a production launch. The build itself has no indexing-blocking defects (no noindex, robots allows all, canonicals correct).

## 🟠 High (within 1 week of content phase)

| # | Action | Where | Effect |
|---|---|---|---|
| H1 | Build 4 individual service pages (800+ words, FR+EN) with `Service`+`Offer`+`BreadcrumbList` | `src/app/[lang]/services/[slug]/` | Fixes thin content; ranks service queries |
| H2 | Replace `Placeholder` divs with real salon/nail-art photos (`next/image`, bilingual alt) | home `page.tsx`, services, gallery | Image SEO + conversion |
| H3 | Normalize meta descriptions to 140–160 chars (dedicated `meta` keys per page) | `src/dictionaries/{en,fr}.json` + page metadata | Stops SERP truncation; lifts CTR |
| H4 | Build `/faq` (`/faq`) with `FAQPage` schema | new route | AI answers + long-tail + GBP synergy |

## 🟡 Medium (within 1 month)

| # | Action | Where | Effect |
|---|---|---|---|
| M1 | Fix heading-order: service-card titles `<h4>`→`<h3>` | home + services `page.tsx` | a11y + content structure |
| M2 | Fix color-contrast on muted text (`text-cream/50-60` on mocha → ≥4.5:1) | `page.tsx` / globals | a11y (WCAG AA) |
| M3 | Build `/reviews` (`/avis`) — on-page reviews + `Review` items + AggregateRating | new route | Trust + review keywords |
| M4 | Build `/gallery` (`/galerie`) — real nail-art portfolio | new route | Image search + engagement |
| M5 | Add `hasMap`, `currenciesAccepted: "CAD"`, `BeautySalon` type to business schema | `src/lib/seo.ts` | Schema completeness |
| M6 | Confirm CWV field data (CrUX) post-deploy; tune framer-motion if INP/CLS off | — | Real performance validation |

## 🟢 Low (backlog)

| # | Action | Effect |
|---|---|---|
| L1 | Launch blog (`/blogue`), 2 posts/month | Topical authority, long-tail |
| L2 | Add `llms.txt` | AI crawler guidance |
| L3 | Localize "Follow us on social" section (still hardcoded EN) | Consistency |
| L4 | Pursue "best-of" list inclusion (threebestrated, heynailsalons, noovomoi) | #1 AI-visibility factor |

## Off-site (not in repo — track in roadmap)
- Resolve stale **"Ongles Lien Pham Nails" NAP duplicate** at 3035 boul Le Carrefour (highest-impact local fix).
- GBP optimization + review-velocity engine.

## Score trajectory
Closing **C1–C2 + H1–H4** lifts content/technical and should move the score from **77 → ~88+**. Remaining gains (90+) come from M-tier polish + deployed field data.
