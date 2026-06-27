---
phase: 03-measurement-conversion
verified: 2026-06-18T18:45:00Z
status: passed
score: 12/12 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Create 'AI Assistants' custom channel group in GA4 Admin before first live traffic"
    expected: "GA4 Admin -> Data display -> Channel groups -> New channel group with condition 'Session source matches regex' set to `.*(chatgpt|openai|perplexity|claude\\.ai|gemini\\.google|copilot\\.microsoft|bing\\.com/chat).*`"
    why_human: "GA4 Admin console is inaccessible to code; channel groups do not backfill so creation must happen before deploy"
  - test: "Flag generate_lead, phone_click, book_cta_click as Key events in GA4 Admin"
    expected: "GA4 Admin -> Events -> Key events — three events appear and are toggled on"
    why_human: "GA4 Admin console action, not configurable in code"
  - test: "Verify live CWV field data on onglessanssouci.com after deploy"
    expected: "PageSpeed Insights / CrUX shows LCP, INP, CLS in 'Good' thresholds with no regressions from added schema/content"
    why_human: "Requires real-user traffic and CrUX data collection; cannot be verified from codebase alone"
  - test: "Validate AI-referrer regex in GA4 Realtime after first AI-referred session"
    expected: "Sessions from chatgpt.com, perplexity.ai, claude.ai etc. appear under the 'AI Assistants' channel group in GA4 Acquisition report"
    why_human: "Requires live traffic; regex is drafted in code but GA4 Admin entry and accuracy must be confirmed empirically"
---

# Phase 3: Measurement-Conversion Verification Report

**Phase Goal:** GA4 installed with a custom channel group capturing AI referrers beyond GA4 native; page-level conversion events fire (phone call, contact-form submit, booking-CTA click); a sticky mobile book/contact CTA + above-the-fold trust signals (rating, years) on key pages; web-vitals RUM (LCP/INP/CLS) captured, consent-gated, with no CWV regressions.
**Verified:** 2026-06-18T18:45:00Z
**Status:** passed (with human verification items for external GA4 Admin actions)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GA4 is env-gated (returns null when `NEXT_PUBLIC_GA_ID` unset) | VERIFIED | `Analytics.tsx:24-27`: `if (!gaId) return null` |
| 2 | `GA_ID_PATTERN = /^G-[A-Z0-9][A-Z0-9-]*$/` blocks injection | VERIFIED | `Analytics.tsx:21`: regex anchored with `^` and `$` |
| 3 | Consent Mode v2 default-denied stub fires `beforeInteractive` before GA4 `afterInteractive` loader | VERIFIED | `Analytics.tsx:43,67`: stub `strategy="beforeInteractive"`, loader `strategy="afterInteractive"`; sets `analytics_storage:'denied'` |
| 4 | `send_page_view:false` on GA4 config; `grantConsent()` fires one manual `page_view` after opt-in | VERIFIED | `Analytics.tsx:78`; `analytics.ts:67`: `window.gtag("event", "page_view")` in `grantConsent()` |
| 5 | `track()` returns early unless `ss_consent=granted` cookie present | VERIFIED | `analytics.ts:31-35,51`: `hasConsentGranted()` reads cookie via `document.cookie`, `if (!hasConsentGranted()) return` |
| 6 | ConsentBar is JS-only — absent from SSR HTML | VERIFIED | `ConsentBar.tsx:48-52`: `useSyncExternalStore` hydration gate; `if (!hydrated) return null` |
| 7 | ConsentBar calls `grantConsent()` on Accept, no gtag call on Decline | VERIFIED | `ConsentBar.tsx:61-68`: Accept calls `writeConsent("granted"); grantConsent()`, Decline calls `writeConsent("denied")` only |
| 8 | `track("generate_lead", { method: "contact_form" })` fires on successful submit (no PII) | VERIFIED | `ContactForm.tsx:36`: fires after `res.ok && json.success`; payload is `{ method: "contact_form" }` only — form data not passed to `track()` |
| 9 | `track("phone_click")` and `track("book_cta_click")` fire on BOTH click and keyboard Enter/Space | VERIFIED | `StickyCtaBar.tsx:62-65,81-84`: `onClick` + `onKeyDown` on `<span>` wrappers; `e.key === "Enter" \|\| e.key === " "` |
| 10 | `KeyPageChrome` (TrustBand SSR + StickyCtaBar) mounted on all 5 key pages | VERIFIED | Confirmed in: `[lang]/page.tsx:104`, `services/page.tsx:67`, `services/[slug]/page.tsx:121`, `faq/page.tsx:48`, `laval/page.tsx:64` |
| 11 | `TrustBand` is a pure SSR server component rendering rating + years above the fold | VERIFIED | `TrustBand.tsx:1-3`: no `"use client"`, renders `site.reviews.ratingValue` + `dict.trust.established`; `site.ts:69`: `established: 2024` |
| 12 | `WebVitalsReporter` registers `onLCP/onINP/onCLS` consent-gated; mounted in `[lang]/layout.tsx` | VERIFIED | `WebVitalsReporter.tsx:30-43`: `if (!consentGranted) return`; `layout.tsx:89,114`: `consentGranted` from SSR cookie, `<WebVitalsReporter consentGranted={consentGranted} />` |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/analytics.ts` | `track()`, `grantConsent()`, `GaEvent` union, consent guard | VERIFIED | All exports present; guard `hasConsentGranted()` reads `SS_CONSENT_COOKIE`; `GaEvent` = `"phone_click" \| "book_cta_click" \| "generate_lead" \| "web_vitals"` |
| `src/components/Analytics.tsx` | Env-gated, consent stub `beforeInteractive`, GA4 loader `afterInteractive` | VERIFIED | Pattern validated, stub ordering confirmed, `send_page_view:false` |
| `src/components/ConsentBar.tsx` | JS-hydration-gated, native `<button>`, calls `grantConsent()` on Accept | VERIFIED | `useSyncExternalStore` gate; no `Button` import; native `<button onClick={handleAccept}>` |
| `src/lib/consent.ts` | `SS_CONSENT_COOKIE` constant, `writeConsent()` client helper | VERIFIED | Exports confirmed; `writeConsent` writes `max-age=31536000; samesite=lax` |
| `src/lib/consent.server.ts` | `import "server-only"` first; runtime-validates cookie value | VERIFIED | Line 9: `import "server-only"` (first non-comment import); validates to `"granted" \| "denied" \| undefined` |
| `src/components/StickyCtaBar.tsx` | Mobile sticky bar, `phone_click`/`book_cta_click` on click and keyboard | VERIFIED | `md:hidden fixed bottom-0`; `onKeyDown Enter/Space` handlers present |
| `src/components/TrustBand.tsx` | SSR server component, rating + years, no placeholder when no live data | VERIFIED | No `"use client"`; `hasLiveData` gate guards rating; `dict.trust.established` always renders |
| `src/components/KeyPageChrome.tsx` | Composes TrustBand + StickyCtaBar; mounted on 5 key pages | VERIFIED | Composition confirmed; all 5 page files import and mount it |
| `src/components/WebVitalsReporter.tsx` | web-vitals v5 `onLCP/onINP/onCLS`, consent-gated | VERIFIED | `if (!consentGranted) return`; registers all three listeners in `useEffect` |
| `next.config.ts` | `withBundleAnalyzer` ANALYZE-gated | VERIFIED | `enabled: process.env.ANALYZE === "true"` |
| `package.json` | `web-vitals ^5.x`, `@next/bundle-analyzer ^16.x` | VERIFIED | `"web-vitals": "^5.3.0"`, `"@next/bundle-analyzer": "^16.2.9"` |
| `src/lib/site.ts` | `established: 2024` | VERIFIED | Line 69: `established: 2024` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/ConsentBar.tsx` | `src/lib/analytics.ts` | `grantConsent()` called on Accept | WIRED | `ConsentBar.tsx:19,62`: imports and calls `grantConsent()` |
| `src/app/[lang]/layout.tsx` | `src/components/Analytics.tsx` | `<Analytics />` mounted in body | WIRED | `layout.tsx:13,106`: imported and rendered |
| `src/app/[lang]/layout.tsx` | `src/lib/consent.server.ts` | SSR cookie read → `consentKnown`/`consentGranted` props | WIRED | `layout.tsx:16,87-89`: `readConsent()` call feeds both props |
| `src/app/[lang]/layout.tsx` | `src/components/WebVitalsReporter.tsx` | `<WebVitalsReporter consentGranted={consentGranted} />` | WIRED | `layout.tsx:15,114` |
| Key pages (5) | `src/components/KeyPageChrome.tsx` | `<KeyPageChrome locale dict consentKnown />` | WIRED | All 5 page files confirmed |
| `src/components/ContactForm.tsx` | `src/lib/analytics.ts` | `track("generate_lead", ...)` on successful submit | WIRED | `ContactForm.tsx:5,36` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `TrustBand.tsx` | `site.reviews.ratingValue`, `dict.trust.established` | `src/lib/site.ts` (static from reviews fetch); `src/lib/dictionary.ts` (locale dictionaries) | Yes — `reviewsFetchedAt` gate ensures rating only shows when real data present; `established: 2024` is authoritative constant | FLOWING |
| `WebVitalsReporter.tsx` | LCP/INP/CLS metric objects | `web-vitals` library browser observers | Yes — real browser performance entries | FLOWING |
| `StickyCtaBar.tsx` | `site.contact.phoneHref`, `site.booking` | `src/lib/site.ts` (NAP source of truth) | Yes — `site` is the single NAP source | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Test suite (120 tests, all phase files covered) | `bun run test` | 20 test files, 120 tests passed in 2.31s | PASS |
| TypeScript type-check | `bunx tsc --noEmit` | No output (clean) | PASS |

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| MEAS-01 | GA4 installed with consent Mode v2 + AI-referrer channel group regex drafted | SATISFIED (code); GA4 Admin config is human-verification | `Analytics.tsx`, `analytics.ts`, `consent.ts`, `consent.server.ts`; AI-referrer regex in PLAN objective |
| MEAS-02 | Page-level conversion events: phone_click, generate_lead, book_cta_click | SATISFIED | `StickyCtaBar.tsx` (phone + book); `ContactForm.tsx` (generate_lead) |
| MEAS-03 | Sticky mobile CTA + above-fold trust signals on key pages | SATISFIED | `KeyPageChrome` on 5 key pages; `TrustBand` SSR; `StickyCtaBar` mobile-only |
| MEAS-04 | web-vitals RUM (LCP/INP/CLS) consent-gated; bundle analyzer ANALYZE-gated | SATISFIED | `WebVitalsReporter.tsx`; `next.config.ts`; `package.json` deps |

---

### Prohibition Checks

| Prohibition | Check | Status |
|-------------|-------|--------|
| ConsentBar MUST NOT appear in SSR HTML | `useSyncExternalStore` hydration gate returns `null` until hydrated | CONFIRMED |
| `Button.tsx` MUST NOT receive `onClick` prop | ConsentBar uses native `<button>`; StickyCtaBar uses `<span onClick>` wrappers around `<Button>` | CONFIRMED |
| GA4 `gtag.js` MUST NOT load before consent-default-denied stub | Stub is `strategy="beforeInteractive"`, GA4 loader is `strategy="afterInteractive"` | CONFIRMED |
| No `new Date()` / dynamic time in added code | The one `new Date()` in `Analytics.tsx:78` is inside a `dangerouslySetInnerHTML.__html` string — browser-side GA4 required call, not SSR code | CONFIRMED |
| No PII or form values in any gtag payload | `track("generate_lead", { method: "contact_form" })` — only a developer label; form `payload` is sent to `/api/contact` separately and never passed to `track()` | CONFIRMED |

---

### Anti-Patterns Found

None blocking. The `new Date()` on `Analytics.tsx:78` is intentional browser-side GA4 initialization — it is inside a `dangerouslySetInnerHTML` script string and never executed during SSR.

---

### Human Verification Required

These items require GA4 Admin console access or live traffic and do NOT block the code-side `status: passed` determination.

#### 1. Create GA4 'AI Assistants' Custom Channel Group

**Test:** In GA4 Admin -> Data display -> Channel groups -> New channel group, create a channel named "AI Assistants" with condition: Session source matches regex `.*(chatgpt|openai|perplexity|claude\.ai|gemini\.google|copilot\.microsoft|bing\.com/chat).*`
**Expected:** Channel group appears in GA4 Acquisition reports; AI-referred sessions are classified under "AI Assistants" rather than "(Other)"
**Why human:** GA4 Admin console is inaccessible to code; channel groups do not backfill, so this MUST be created before the first new page goes live

#### 2. Flag Conversion Events as Key Events in GA4 Admin

**Test:** GA4 Admin -> Events -> Key events — toggle `generate_lead`, `phone_click`, `book_cta_click` as Key events
**Expected:** Three events appear in the Key events list; GA4 conversion rate reporting becomes available
**Why human:** GA4 Admin console action, not configurable in code or environment variables

#### 3. Validate CWV Field Data on Live Site

**Test:** After deploy, check PageSpeed Insights for onglessanssouci.com; allow 28-day CrUX window or check CrUX API
**Expected:** LCP, INP, CLS all in "Good" thresholds; no regression from schema/content additions in Phase 2
**Why human:** Requires real-user traffic and CrUX data collection; lab data (Lighthouse) is a proxy only

#### 4. Validate AI-Referrer Regex Against Live GA4 Realtime

**Test:** After deploying and creating the channel group, visit the site from a link shared in ChatGPT/Perplexity/Claude.ai, then check GA4 Realtime -> Acquisition
**Expected:** Session appears under "AI Assistants" channel group
**Why human:** Requires live traffic; regex accuracy must be confirmed empirically and refined if needed

---

### Gaps Summary

No gaps. All 12 code-side must-haves are VERIFIED. The 4 human verification items above are external GA4 Admin and live-traffic checks that the implementation has been designed to support but that cannot be confirmed from the codebase alone. They are documented as deploy-time actions in the PLAN's `user_setup` section.

---

_Verified: 2026-06-18T18:45:00Z_
_Verifier: Claude (gsd-verifier)_
