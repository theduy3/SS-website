# SEO verification checklist — run before any further SEO code

Written 2026-07-09, after PR #46 (`bdea9da`) fixed four legacy URLs that 301'd into 404s.

**Why this exists.** Two competing explanations for the 2026-05-31 click collapse are still
unresolved, and they imply opposite next actions. Building pages before resolving them risks
spending a week on demand that does not exist. Each step below names the outcome that
distinguishes the hypotheses.

---

## H1 — Measurement artifact
The Search Console export came from the `https://www.onglessanssouci.com/` **URL-prefix**
property. The site canonicalizes to the bare host. That property drains toward zero on its own,
regardless of site health.

## H2 — Sitelink accounting
The `Pages` table sums to **14,422** impressions against a property total of **7,893** — a
**1.83×** ratio. GSC only does that when one search result surfaces several pages. If `/prix`,
`/about` and `/annonce` are sitelinks under the brand result, their impressions are logged at the
parent's position and are never clicked directly. Their "0% CTR" is then an artifact, not a defect.

## H3 — Google Business Profile absorption
Mobile: 227 of 350 clicks, average position **2.37**, CTR **3.77%**.
Desktop: 123 clicks, average position **24.1**, CTR **6.87%**.
Ranking #1 for `sans souci ongles & spa - cf carrefour laval` yields a **1.9%** CTR. Ranking 2.07
for `sans souci` yields **0%**. If the local pack takes the click, no on-site change recovers it.

---

## Steps

### 1. Create a Domain property — blocks everything else
Search Console → Add property → **Domain** → `onglessanssouci.com` → verify via DNS TXT.

Unifies `www` + bare + all four locale prefixes. GSC backfills history, so data is available
immediately.

- **Then re-pull the same 7 CSVs from the Domain property.**
- If Domain-property clicks over Jun 1 – Jul 6 are materially higher than the 35 the www property
  reported → **H1 confirmed**, and the "84% collapse" is partly an illusion.
- If they match (~35) → H1 is not the story; the loss is real. Proceed to step 2.

### 2. Test the sitelink hypothesis
Performance → filter **Query** = `sans souci` (exact) → open the **Pages** tab.

- Impressions spread across `/`, `/prix`, `/about`, `/annonce` → **H2 confirmed.** Those pages'
  0% CTR is sitelink accounting. Do **not** build pages to "fix" it, and do not rewrite `/about`'s
  title on the assumption its copy is at fault.
- Impressions concentrated on a single page → H2 rejected; per-page CTR is a real signal worth
  optimizing.

### 3. Test the local-pack hypothesis
Google Business Profile → Performance. Compare, for the same date range:

- GBP **website clicks** vs. GSC organic clicks. GBP >> GSC → **H3 confirmed**, the profile is
  intercepting demand and the highest-leverage work is off-repo.
- Also check GBP calls + direction requests. Those are conversions the website never sees, so the
  "84% click loss" may overstate the business impact.
- Sanity check by hand: mobile incognito search `ongles sans souci`. Note whether a local pack,
  an AI Overview, or a booking module sits above the first organic result.

### 4. Confirm Google has recrawled the redirects
URL Inspection on `https://www.onglessanssouci.com/prix`.

- Expect **"Page with redirect"**. Until then the 301s have not propagated and *no* traffic change
  is attributable to PR #46. Allow days-to-weeks.
- Repeat for `/reservation`, `/carte-cadeau`, `/annonce`.

### 5. Explain the empty Search appearance report
`Search appearance.csv` was header-only — **zero rich results** — despite the site shipping
NailSalon, FAQPage, AggregateRating, ImageGallery and AggregateOffer JSON-LD.

- Re-check in the Domain property first; this may be another symptom of H1.
- If still empty, run the Rich Results Test against `https://onglessanssouci.com/fr` and
  `https://onglessanssouci.com/fr/faq`. A genuine schema failure is a real bug worth a PR.

### 6. Set the post-fix baseline
Deploy landed **2026-07-09**. Compare 28 days after against 28 days before, **in the Domain
property only**.

> Expect www-property clicks to stay flat regardless. That is the predicted outcome of H1, not
> evidence the fix failed.

---

## Decision table

| Outcome | Next action |
|---|---|
| H1 confirmed | Re-baseline. Most of the "collapse" was never real. Re-run this analysis on clean data before planning content. |
| H2 confirmed | Stop treating page-level CTR as a content signal. `/prix` and `/about` need no rewrite. |
| H3 confirmed | Highest-leverage work is the Google Business Profile — review velocity toward 4.5★ (currently 4.2 / 312), photos, posts, booking link. Not code. |
| All three rejected | The loss is real, on-site, and unexplained. Reopen with page-level CTR work and a `/fr/laval` rebuild targeting `ongles laval` (pos 18.3), `nail salon laval` (8.7), `pedicure laval` (14.6). |

## Known non-starters

- **A dedicated `/prix` page.** Across 399 queries, exactly one carries price intent
  (`shellac nails price near me`: 1 impression, 0 clicks). The old page's 5,161 impressions were
  sitelink real estate, not price demand. Building it would also make the `/prix` redirect key
  shadow a live route — `legacy-redirects.test.ts` would fail, correctly.
