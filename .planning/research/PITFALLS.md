# Pitfalls Research

**Domain:** GEO + SEO optimization for a multilingual local service business (Next.js 16 App Router, Montreal nail salon)
**Researched:** 2026-06-17
**Confidence:** HIGH — all critical pitfalls corroborated across 3+ independent sources; one MEDIUM area noted inline

---

## Critical Pitfalls

### Pitfall 1: JsonLd.tsx XSS via unescaped `<` in schema values

**What goes wrong:**
`JSON.stringify()` does not escape the `<` character. If any schema field value — a service description, business name, FAQ answer, or review excerpt — contains `</script>`, the JSON-LD block closes the surrounding `<script>` tag and opens an arbitrary inline script. Because the site has no CSP (`next.config.ts` explicitly defers CSP), there is no second defence layer. This is a crawler-visible page, so the injected payload would run for every visitor.

**Why it happens:**
Developers assume `JSON.stringify()` is safe for `<script>` context. It is not — it only produces valid JSON, not safe HTML. The Next.js official JSON-LD guide specifically calls out this distinction, and the existing `JsonLd.tsx` component skips the escape step.

**How to avoid:**
One-line fix in `src/components/JsonLd.tsx`:
```typescript
__html: JSON.stringify(data).replace(/</g, "\\u003c"),
```
No library needed. Apply before any other schema work, since every subsequent schema addition feeds through this component.

**Warning signs:**
- `src/components/JsonLd.tsx` renders `dangerouslySetInnerHTML` without a `.replace(/</g, ...)` call
- Any schema value sourced from user-controlled or external data (Google reviews, popup content, contact form echoes)
- No `Content-Security-Policy` header in HTTP responses (verify with DevTools → Network → response headers)

**Phase to address:** Phase 1 (before any schema content is wired up or expanded). Fixing this first prevents every subsequent schema addition from carrying the vulnerability.

---

### Pitfall 2: AggregateRating on first-party reviews triggers Google manual action

**What goes wrong:**
Adding `AggregateRating` to `LocalBusiness` schema using self-published testimonials — reviews the business controls, writes, or curates directly — violates Google's structured data policy. Google's guidelines (last updated 2025-12-10) explicitly exclude pages "where the entity being reviewed controls the reviews about itself" from the review rich result. Violations can trigger a manual action that removes all rich snippets sitewide, not just the offending page.

**Why it happens:**
The existing `AggregateRating` builder in `src/lib/seo.ts` is gated on real review data from `scripts/fetch-google-reviews.mjs`. The pitfall occurs when that gate is bypassed — e.g., hardcoding a rating for launch before the review feed is confirmed, or adding testimonial-sourced reviews to augment the count.

**How to avoid:**
- `AggregateRating` must only emit when `scripts/fetch-google-reviews.mjs` provides data — a genuine Google Business Profile fetch.
- Never augment `reviewCount` by including admin-authored testimonials.
- The schema gate (`if (reviews.length > 0)`) in `seo.ts` must be enforced; confirm it cannot be accidentally bypassed in new page templates.
- Add a CI check: if `GOOGLE_REVIEWS_JSON` env is absent, the build should emit no `AggregateRating` block, not fall back to a placeholder rating.

**Warning signs:**
- A hardcoded `ratingValue` or `reviewCount` anywhere in `seo.ts` or page files (not derived from the review fetch script)
- Google Search Console reporting "Manual actions" or structured data warnings on rich results
- `AggregateRating` emitting on pages that have no associated third-party review data

**Phase to address:** Phase 1 (schema wiring). Validate with Google's Rich Results Test before deploying any page with `AggregateRating`.

---

### Pitfall 3: FAQPage schema text diverges from visible HTML

**What goes wrong:**
Google cross-references JSON-LD `FAQPage` markup against the rendered visible text. If the question or answer in JSON-LD differs in wording, length, or content from what appears in the page HTML — including if FAQ answers collapse inside a JavaScript accordion and only render post-hydration — Google flags the markup as mismatched and ignores it. More critically, LLMs do not parse schema as structured data; they read raw text including schema values. A mismatch means an AI engine can surface an answer the user never sees, which is a reliability failure that undermines citation quality. Note: Google deprecated FAQ rich results in May 2026 (no longer appearing in SERPs), but the schema remains valid for AI consumption and must still mirror visible content to avoid being treated as spam.

**Why it happens:**
Developers write schema in `seo.ts` before finalising page copy, then the copy drifts. Or FAQ answers are placed in a `"use client"` accordion component (invisible to crawlers) while the schema is added server-side. This codebase has a known `faqPageGraph()` builder in `seo.ts` — the risk is highest during the FAQ hub page implementation when content and schema are authored in parallel.

**How to avoid:**
- FAQ answers must be SSR-rendered plain text in the HTML — no client-only accordion that reveals answers after hydration.
- The text in `faqPageGraph()` entries must be copied verbatim from the visible `<p>` or `<dd>` elements on the page, not paraphrased.
- Use `curl -s https://onglessanssouci.com/en/faq | grep -A2 "acceptedAnswer"` to spot-check that schema text appears in raw HTML.
- When editing FAQ copy, update both the page component and the schema builder in the same commit.

**Warning signs:**
- FAQ content lives in a `"use client"` component with `useState` controlling visibility
- `curl` of the page URL does not return the answer text in the raw HTML body
- Schema `acceptedAnswer.text` differs in word count or phrasing from the page's `<p>` elements

**Phase to address:** FAQ hub implementation phase. Add a smoke test: `curl` the FAQ page and assert at least 3 question strings are present in the raw response body.

---

### Pitfall 4: CDN or WAF silently blocks AI crawlers despite correct robots.txt

**What goes wrong:**
robots.txt is an honor-system intent signal. If Dokploy's reverse proxy, a Cloudflare WAF, or any intermediate layer classifies GPTBot / ClaudeBot / OAI-SearchBot / PerplexityBot as scrapers and returns 403 or 429, the crawlers abandon the site entirely — no citations, no training data, no search surface in AI engines — regardless of what robots.txt says. Cloudflare began blocking AI crawlers by default on new domains in 2024; approximately 27% of sites are unknowingly blocking AI crawlers at the CDN layer.

**Why it happens:**
Robots.txt is configured in `src/app/robots.ts` and looks correct. But the actual HTTP response to AI crawler user-agents is determined by network-layer rules the developer may not have touched. Dokploy's proxy or any upstream rate-limiting middleware can return 403 for high-frequency crawlers without changing robots.txt.

**How to avoid:**
- Audit from server logs: `grep -i "gptbot\|claudebot\|perplexitybot\|oai-searchbot" /var/log/nginx/access.log | awk '{print $9}' | sort | uniq -c` — confirm 200 responses, not 403/429.
- Or use `curl -A "GPTBot/1.0" https://onglessanssouci.com/en` from an external machine and verify 200 response.
- Confirm `User-agent: *` with no Disallow rules for public pages in the deployed `robots.txt` output at `https://onglessanssouci.com/robots.txt`.
- Distinguish per-purpose bots: blocking `ClaudeBot` (training) is acceptable; `Claude-SearchBot` (citation indexing) must be allowed. Each token needs its own directive. Blanket blocking removes citation eligibility entirely.

**Warning signs:**
- Server logs show 403 or 429 for AI user-agent strings
- `https://onglessanssouci.com/robots.txt` shows `Disallow: /` or missing allow rules for AI user-agents
- Cloudflare (or any WAF) "Bot Fight Mode" is enabled without AI-crawler exemptions

**Phase to address:** Crawl hygiene phase (early). This is a prerequisite gate — if crawlers cannot reach the site, no schema or content work produces citations.

---

### Pitfall 5: Orphan pages and content invisible to AI because of STANDALONE_PATHS coupling

**What goes wrong:**
The existing `STANDALONE_PATHS` coupling in `src/proxy.ts` means any new un-localized route (e.g., `/faq` instead of `/[lang]/faq`) not registered in `STANDALONE_PATHS` receives a locale redirect and returns 404 to crawlers. This is a known fragile area from `.planning/codebase/CONCERNS.md`. For the GEO milestone, this creates a specific risk: if `llms.txt`, `llms-full.txt`, or any static file in `public/` is accidentally routed through the locale middleware, AI crawlers receive a 302 redirect instead of the file. Crawlers that do not follow redirects (or that time out during redirect chains) never index the content.

**Why it happens:**
Developers adding a GEO asset (`/llms.txt`, `/sitemap.xml`, `/robots.txt`) correctly place it in `public/` and assume Next.js serves it at the root. The middleware in `src/proxy.ts` is checked only when a runtime 404 appears. Static files in `public/` bypass middleware in Next.js App Router — but if any path collision exists between a `src/app/` route and a `public/` file, the app route wins. The risk also applies to any new API route or page added without a `STANDALONE_PATHS` entry.

**How to avoid:**
- Always verify new routes in `src/proxy.test.ts` — add an assertion that the route returns 200 from the path without a locale prefix.
- Static files in `public/` (`llms.txt`, `llms-full.txt`) are exempt from the middleware by default in Next.js — confirm with `curl https://onglessanssouci.com/llms.txt` after deploy.
- The `FAQ hub` must be at `/[lang]/faq` (locale-prefixed), not `/faq`, to match the existing routing model — do not create a standalone FAQ route.
- After each new route is added, audit `src/proxy.test.ts` for coverage before merging.

**Warning signs:**
- `curl -L https://onglessanssouci.com/llms.txt` shows a redirect to `/fr/llms.txt` (404)
- A new route works locally but returns 404 on production
- `src/proxy.test.ts` has fewer path assertions than the number of non-`[lang]` routes in `src/app/`

**Phase to address:** Every implementation phase that adds a new route or static file. The proxy coupling check must be a merge gate, not an afterthought.

---

### Pitfall 6: AI-referrer attribution systematically undercounted — treating GA4 as a complete picture

**What goes wrong:**
GA4 captures at most 30–65% of real AI-referred traffic. The shortfall comes from three sources: (1) Claude strips referrer headers on most sessions ("dark referrer"), attributing visits to Direct; (2) GA4's native "AI Assistant" channel (added May 13, 2026) covers only ChatGPT, Gemini, and Claude — Perplexity and Copilot remain in Referral; (3) GA4's JavaScript tag never fires for AI crawler visits (bots), so training/indexing activity is invisible. Teams that read GA4 AI-referrer numbers as absolute will declare GEO is not working when actual citation is occurring but untracked.

**Why it happens:**
GA4 is the familiar measurement tool. The native AI Assistant channel is new and incomplete. The dark referrer phenomenon is unfamiliar to most implementers — Claude.ai does not pass `Referer` headers on many responses, so sessions land as "Direct / None" in GA4 even when they originate from a Claude citation.

**How to avoid:**
- Build the custom regex channel group (`chatgpt\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|openai\.com`) and place it **above** the Referral channel in GA4 priority order — GA4 assigns the first matching channel.
- Do not use GA4 numbers as absolute AI-referrer counts. Frame them as a floor: "at least X visits from AI this month."
- Supplement GA4 with server log analysis for AI user-agent activity (crawl patterns, not human visits, but useful for correlating content indexed vs. traffic sent).
- Monitor ChatGPT's `utm_source=chatgpt.com` parameter (appended since June 2025) as a more reliable signal than referrer for ChatGPT traffic specifically.
- Treat conversion rate and engagement depth from the AI channel as more meaningful than raw session count — AI-referred visitors convert at ~4.4x the rate of organic; even a small confirmed cohort validates the investment.

**Warning signs:**
- GA4 reports 0 sessions from AI channels but server logs show GPTBot crawls — the tag and measurement are working; citation is just low, which is expected pre-launch
- "Direct / None" channel has an unusual spike in sessions with high engagement depth — potential dark-referrer AI traffic
- GA4 AI channel shows only ChatGPT and Gemini but not Perplexity, suggesting the native channel is active but custom regex is not yet built

**Phase to address:** Analytics phase. Implement the custom channel group before launch so data is attributable from day one; it does not backfill.

---

### Pitfall 7: hreflang reciprocity breaks on new pages, suppressing AI crawl equity across locales

**What goes wrong:**
hreflang requires every page in a language cluster to link back to every other variant, including itself. If a new page is added (e.g., `/en/faq`) and the corresponding `/fr/faq`, `/es/faq`, `/ar/faq` pages are not added simultaneously with reciprocal `alternates.languages` entries, Google (and AI crawlers that respect link equity) ignores all hreflang signals for the entire cluster. The existing `pageMetadata()` builder in `src/lib/seo.ts` generates `alternates.languages` entries — but only if the implementer passes the correct locale map. A missing locale silently produces an incomplete reciprocal set.

**Why it happens:**
The i18n routing model (`src/app/[lang]/*`) requires all four locale variants to exist for each route. During phased content rollout, it is tempting to ship the English FAQ page first and add translations later. The hreflang signals for the shipped page are invalid until all reciprocals exist.

**How to avoid:**
- Ship all four locale variants of a new page simultaneously, or add `x-default` and only the ready locales with a clear plan for the rest.
- The `pageMetadata()` call must include all four locales in its `alternates.languages` map — do not omit locales with placeholder content.
- Validate with a `curl https://onglessanssouci.com/en/faq | grep hreflang` and confirm 4 entries (en, fr, es, ar) plus self-referential.
- Google Search Console → "International Targeting" report will flag hreflang errors within 72 hours of indexing.

**Warning signs:**
- A new page's `generateMetadata()` call has fewer than 4 keys in `alternates.languages`
- `curl` of the page shows `hreflang="en"` pointing to itself but no fr/es/ar alternates
- Google Search Console International Targeting report shows "Return tag missing" errors after a new page deploy

**Phase to address:** FAQ hub and any new page implementation phase. The i18n dictionary and hreflang completeness check must be a merge requirement.

---

### Pitfall 8: NAP inconsistency across schema, footer, and contact page causes AI model omission

**What goes wrong:**
AI models cross-reference name, address, and phone number (NAP) across the website, Google Business Profile, and third-party listings. When the `LocalBusiness` schema emits one phone format (e.g., `+1-514-555-0000`) while the footer shows `514.555.0000` and the contact page shows `(514) 555-0000`, AI models detect the inconsistency and lower confidence in the source — the conservative response is omission rather than hallucination. The existing codebase has no single NAP constant; values are likely duplicated in schema builders and component copy.

**Why it happens:**
Schema values in `seo.ts` and displayed copy in page components are authored separately and drift over time. No single source of truth exists yet.

**How to avoid:**
- Create a `src/lib/nap.ts` constants file: `BUSINESS_NAME`, `BUSINESS_ADDRESS` (object), `BUSINESS_PHONE`, `BUSINESS_HOURS` as typed constants.
- Import these into `seo.ts` schema builders, footer components, contact page, and `public/llms.txt`.
- Format phone and address identically everywhere: pick one canonical format and enforce it via TypeScript type.
- Audit Google Business Profile against the schema values after implementation — if GBP shows a different address format, update GBP to match, not the schema.

**Warning signs:**
- Searching the codebase for the phone number string returns more than one file with different formats
- Footer component has a hardcoded address string that does not reference a constant
- `seo.ts` has a `telephone` field with a different format than the `<a href="tel:...">` in the header CTA

**Phase to address:** NAP constants extraction is a prerequisite for all other schema and content work — implement before expanding schema or writing `llms.txt`.

---

### Pitfall 9: llms.txt treated as a sitemap or SEO ranking signal

**What goes wrong:**
Two failure modes exist: (1) overstuffing — listing every URL with no descriptions, making the file useless as a curated guide; (2) misattributing effect — expecting `llms.txt` to improve Google rankings or guarantee AI citations. No major AI provider has published documentation confirming they act on `llms.txt`. Google explicitly states Search does not crawl or use it (the Chrome Lighthouse audit is for agentic readability, not indexing). The SEO risk comes from companion Markdown files: if per-page `.md` duplicates of all HTML pages are created and left indexable, Google treats them as duplicate content, diluting crawl budget and suppressing the original pages.

**Why it happens:**
`llms.txt` is positioned as a quick win. Developers interpret "AI companies may read this" as "this improves citations." The companion file approach (`llms-full.txt` pulling from generated per-page Markdown) crosses into duplicate-content territory if those Markdown files have accessible URLs.

**How to avoid:**
- Keep `llms.txt` curated: business identity summary, service list with descriptions, FAQ hub link, hours, booking URL. Under 500 words. No raw URL dumps.
- `llms-full.txt` should concatenate curated content, not auto-generated per-page Markdown files. Write it by hand or from the NAP constants + FAQ hub content only.
- Never create indexable Markdown duplicates of existing HTML pages. If Markdown files are generated, add them to `robots.txt` Disallow or exclude from the sitemap.
- Do not treat `llms.txt` as a substitute for structured data, answer-first content, or GBP optimization — those are the actual citation drivers.

**Warning signs:**
- `llms.txt` has more than 20 URLs listed without descriptions
- Markdown files exist in `public/` with accessible URLs and identical content to HTML pages
- Any code adds `llms.txt` as an input to `sitemap.ts` or treats it as a ranking signal in analytics

**Phase to address:** `llms.txt` creation phase. Keep scope minimal — the effort should be under 4 hours total, not a content system.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode `ratingValue`/`reviewCount` in schema for launch | Pages emit star rating immediately without waiting for review fetch | Google manual action removes all rich snippets; trust signal failure if count drifts | Never — always gate on real review data |
| Write FAQ schema before FAQ page copy is finalised | Schema done early, content team can iterate | Schema diverges from visible text; Google flags as mismatch; AI surfaces wrong answers | Never — finalize copy, then write schema |
| Add GA4 AI-referrer tracking after launch | Simpler launch sequence | No backfill — AI channel data starts from when channel is created; pre-launch traffic is permanently unattributed | Never — configure before first page goes live |
| Ship English-only FAQ page and add translations "later" | Faster to market in one locale | hreflang cluster is invalid until all locale variants exist; no SEO equity for incomplete set | Acceptable only if no hreflang tags are emitted at all until all variants exist |
| Skip the `JsonLd.tsx` XSS fix because "schema values are internal" | Saves 5 minutes | Schema values include Google review text (external) and future user-generated content; XSS vector is real | Never — fix takes one line |
| `"use client"` for FAQ accordion with SSR fallback | Better UX with animation | AI crawlers and GPTBot see only the fallback — if fallback omits answer text, schema is unverifiable | Acceptable only if SSR renders full answer text in DOM; accordion only hides UI, not content |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Reviews fetch script (`scripts/fetch-google-reviews.mjs`) | Assuming the fetch succeeds in CI/CD and the JSON is always fresh | Add a build-time check: if the JSON is older than 7 days or missing, fail loudly (or use a stale cache with a warning) |
| GA4 custom channel group | Creating the regex channel after existing traffic has been attributed — no backfill | Create the channel group before the `next/script` GA4 tag is deployed; channels apply forward only |
| `src/proxy.ts` STANDALONE_PATHS | Adding a new `src/app/*/page.tsx` without a corresponding proxy test | Every new non-`[lang]` route needs a `src/proxy.test.ts` assertion before merge |
| Next.js `generateMetadata` + hreflang | Passing hardcoded locale strings to `alternates.languages` instead of deriving them from the i18n config | Derive locale keys from `src/lib/i18n.ts` locale list so adding a new locale automatically propagates to all metadata |
| Robots.txt (`src/app/robots.ts`) | Disallowing `/api/*` globally, which may block `OAI-SearchBot` if it fetches metadata via API routes | Confirm the Disallow only covers internal/admin API routes, not public metadata endpoints |
| `llms.txt` static file in `public/` | Assuming middleware doesn't touch static files without verifying | `curl https://onglessanssouci.com/llms.txt` after deploy — confirm 200, not 302/404 |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Heavy Framer Motion animations block INP | INP > 200ms on mobile; main thread blocked during user interaction | Audit with `web-vitals` RUM; use `will-change: transform` and avoid synchronous layout in animation callbacks | Any page with CSS-in-JS or JS animation on interaction |
| SSR page with blocking data fetch (Google Reviews) hits AI crawler timeout | AI crawler receives 499 timeout; page never indexed | Cache the review JSON at build time (`scripts/fetch-google-reviews.mjs` already does this); ensure the cached file is not stale at build | If review fetch adds > 2s to TTFB |
| Uncompressed images cause LCP > 2.5s | Lighthouse LCP red; AI crawlers with < 5s timeout abandon fetch | Use Next.js `<Image>` with WebP/AVIF auto-conversion; add `priority` prop to hero image | Any page where the largest contentful element is an unoptimized `<img>` |
| Framer Motion double-loaded (SSR + client hydration) | Bundle size spike; extra parse time | Run `ANALYZE=true bun run build` and inspect the Framer Motion chunk; confirm it is not included in more than one bundle | If `framer-motion` appears in both server and client bundles |
| GA4 script with `strategy="beforeInteractive"` | INP penalty from synchronous analytics load | Use `strategy="afterInteractive"` (the correct default) | First deploy of GA4 if strategy is not explicitly set |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `JsonLd.tsx` emits unescaped `<` | XSS via schema value containing `</script>`; runs in all visitors' browsers | `.replace(/</g, "\\u003c")` in `dangerouslySetInnerHTML` value — fix before any new schema is added |
| No CSP while JSON-LD and third-party widget scripts run on same page | No second-line defence if XSS occurs via schema or widget script mutation | After XSS fix, add a nonce-based CSP that allowlists `app.onglessanssouci.com`; this is the existing CONCERNS.md TODO |
| Admin popup images accepted without MIME or size validation | Malicious file upload masquerading as image; storage cost abuse | Already flagged in CONCERNS.md; block if MIME is not `image/jpeg|png|webp`; max 5MB server-side |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Answer-first content is technically correct but reads as robotic keyword listing | AI-referred visitors (higher intent) bounce immediately; trust signals absent | Write answers as a knowledgeable person speaking to a customer, not as a spec: "Our gel manicures last 2–3 weeks and are removed free with your next appointment" not "Gel manicure duration: 14–21 days" |
| Trust signals (rating, years, response time) appear below the fold on mobile | AI-referred visitors who arrive with intent but no prior brand awareness bounce before converting | Sticky mobile CTA + above-fold rating chip in the hero section; the `AggregateRating` schema already provides the data — reflect it visually |
| FAQ answers too long (> 100 words per answer) | AI engines extract from the first ~60 words; long answers dilute the extractable signal | Target 40–70 word answers per question; longer context belongs in a separate section below, not inside the FAQ answer element |
| Arabic RTL layout breaks with new content sections | Arabic users see misaligned CTA buttons or mirrored icon directions | All new page sections must be tested with `lang="ar"` and `dir="rtl"`; use `src/lib/i18n.ts`'s `dirFor()` helper — do not hardcode `dir` or text-align in new components |

---

## "Looks Done But Isn't" Checklist

- [ ] **JsonLd XSS fix:** Confirm `src/components/JsonLd.tsx` has `.replace(/</g, "\\u003c")` — verify before any schema content is added, not after
- [ ] **AggregateRating gate:** Confirm `seo.ts` emits `AggregateRating` only when `reviewCount > 0` from the fetch script — no hardcoded fallback rating
- [ ] **FAQPage schema matches visible HTML:** `curl` the FAQ hub page and grep for at least 5 question strings — they must appear in raw HTML, not only in JSON-LD
- [ ] **robots.txt allows AI crawlers:** `curl https://onglessanssouci.com/robots.txt` — confirm `User-agent: *` with no blanket Disallow, and confirm `GPTBot`, `ClaudeBot`, `OAI-SearchBot`, `PerplexityBot` are not named in Disallow directives
- [ ] **AI crawlers receive 200 responses:** `curl -A "GPTBot/1.0" https://onglessanssouci.com/en` from an external machine — confirm 200, not 403/429
- [ ] **hreflang reciprocal set complete:** Every new locale page has 4 `alternates.languages` entries (en, fr, es, ar) plus `x-default` — validate with `curl | grep hreflang`
- [ ] **NAP is consistent:** Phone number, address, and business name match exactly between `LocalBusiness` schema, footer, contact page, and `llms.txt`
- [ ] **llms.txt is not locale-redirected:** `curl https://onglessanssouci.com/llms.txt` returns the file content, not a redirect
- [ ] **GA4 custom channel is above Referral:** In GA4 Admin → Channel groups, the AI regex channel is listed before Referral in priority order
- [ ] **New STANDALONE_PATHS entries tested:** Every new non-`[lang]` route has a `src/proxy.test.ts` assertion before merge

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| AggregateRating manual action from Google | HIGH (weeks to recover rich results) | Remove the offending markup immediately, submit reconsideration request in Search Console, do not re-add until only genuine third-party review data is used |
| FAQPage schema mismatch flagged in Search Console | LOW (fix and re-deploy) | Update schema text to exactly match visible HTML, re-validate with Rich Results Test, submit URL for re-indexing |
| AI crawlers blocked at CDN layer | MEDIUM (coordination with infra) | Check WAF rules for AI user-agent blocking, add exceptions for specific bot user-agents, verify with server logs after change |
| hreflang reciprocal errors | LOW (add missing pages or remove incomplete signals) | Either add all missing locale variants, or remove `alternates.languages` entries until the full set is ready |
| GA4 AI channel created after traffic — no backfill | LOW-MEDIUM (lost historical data only) | Create the channel immediately, accept the data gap, compare month-over-month from creation date forward |
| llms.txt returns 404 or redirect | LOW (deploy fix) | Verify file is in `public/`, not in `src/app/`; confirm no proxy rule intercepts root-level requests to unknown paths |
| JsonLd XSS exploited | HIGH (incident response, CSP roll-out) | Apply `.replace(/</g, "\\u003c")` fix and deploy immediately; add CSP header; audit all schema values for user-controlled content; rotate any session secrets if admin panel was targeted |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| JsonLd XSS | Phase 1 — schema security hardening (first task) | Code review: `JsonLd.tsx` has `.replace()` call; no other `dangerouslySetInnerHTML` JSON path exists |
| AggregateRating self-serving reviews | Phase 1 — schema wiring | Rich Results Test on each page with AggregateRating; confirm reviewCount is dynamic, not hardcoded |
| FAQPage schema vs visible content mismatch | FAQ hub implementation phase | `curl` raw HTML and grep for question text; SSR rendering confirmed |
| CDN/WAF blocking AI crawlers | Crawl hygiene phase (prerequisite) | `curl -A "GPTBot/1.0"` returns 200; server logs show no 403/429 for AI agents |
| STANDALONE_PATHS coupling | Every new-route phase | `src/proxy.test.ts` assertion exists before merge |
| AI-referrer undercounting | Analytics phase (before launch) | GA4 custom channel created; ChatGPT UTM tracked; baseline dark-referrer methodology documented |
| hreflang reciprocity breaks | Any new page implementation phase | `curl | grep hreflang` shows 4+ entries on every new page before merge |
| NAP inconsistency | NAP constants phase (prerequisite to all schema) | Single `src/lib/nap.ts` constants file; grep confirms no hardcoded phone/address strings outside it |
| llms.txt treated as ranking signal | `llms.txt` creation phase | File is < 500 words, has descriptions, is not referenced in `sitemap.ts`, is confirmed accessible via `curl` |
| Framer Motion INP regression | Performance phase | `web-vitals` RUM shows INP < 200ms at 75th percentile; bundle analyzer confirms no double-load |

---

## Sources

- [Next.js JSON-LD Official Guide — XSS escape pattern](https://nextjs.org/docs/app/guides/json-ld) (HIGH confidence)
- [Google Structured Data — Review Snippet policy, updated 2025-12-10](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) (HIGH confidence)
- [Google FAQ Rich Results Deprecated — May 2026](https://www.getpassionfruit.com/blog/what-changed-with-google-drops-faq-rich-results-and-what-to-do-now) (HIGH confidence)
- [FAQ Schema Mismatch — visible content requirement](https://www.seosiri.com/2025/04/faq-schema-explained.html) (HIGH confidence)
- [AI Crawlers Explained — GPTBot, ClaudeBot, PerplexityBot (2026)](https://www.anagram.ai/blog/ai-crawlers-explained-gptbot-claudebot-perplexitybot-and-how-to-let-them-in-2026) (HIGH confidence)
- [AI Crawler Management — CDN blocking, WAF override](https://alicelabs.ai/en/insights/ai-crawler-management) (HIGH confidence)
- [How to Track AI Traffic in GA4 — custom channel, dark referrer](https://www.swydo.com/blog/track-ai-traffic-in-ga4/) (HIGH confidence)
- [GA4 AI Assistant channel launch (May 13 2026), coverage gaps](https://martech.org/how-ga4-records-traffic-from-perplexity-comet-and-chatgpt-atlas/) (HIGH confidence)
- [Hreflang common errors — reciprocal links, self-referential](https://www.searchenginejournal.com/ask-an-seo-what-are-the-most-common-hreflang-mistakes/556455/) (HIGH confidence)
- [Core Web Vitals 2026 — INP, LCP, CLS; crawler timeout behavior](https://discoveredlabs.com/blog/page-speed-core-web-vitals-performance-optimization-for-ai-crawlability) (HIGH confidence; agency observations, not official specs)
- [Page Speed and AI Crawler Access — TTFB thresholds](https://aivis.biz/signals/page-speed/) (MEDIUM confidence — practitioner observations)
- [llms.txt mistakes — sitemap confusion, duplicate content risk](https://www.incremys.com/en/resources/blog/llms-txt) (MEDIUM confidence — proposed standard, no confirmed provider adoption)
- [llms.txt SEO risk from indexable Markdown duplicates — Omnius](https://www.omnius.so/blog/llms-txt-file) (MEDIUM confidence)
- [ChatGPT utm_source parameter tracking (June 2025)](https://finance.yahoo.com/sectors/technology/articles/track-ai-traffic-ga4-chatgpt-122500037.html) (HIGH confidence)
- [Dark Visitors — bot traffic identification](https://contently.com/2026/05/06/ai-crawlers-explained-gptbot-claudebot-perplexitybot/) (MEDIUM confidence)

---

*Pitfalls research for: GEO + SEO optimization — Ongles Sans Souci Montreal nail salon (Next.js 16)*
*Researched: 2026-06-17*
