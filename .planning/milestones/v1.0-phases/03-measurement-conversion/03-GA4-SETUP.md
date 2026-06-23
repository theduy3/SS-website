# Phase 03 — GA4 Console Setup (deploy-time, manual)

> Source-verified checklist for the external GA4 Admin work that activates the Phase 03
> measurement code. The code ships dormant: with `NEXT_PUBLIC_GA_ID` unset, `Analytics.tsx`
> returns null — no GA scripts, no transmission. These steps turn it on.
>
> Status: **pending** (console actions, not code). Code side verified 12/12 in `03-VERIFICATION.md`.
> All values below confirmed against source on 2026-06-18.

## Do in order — dependencies matter

Steps 1→2→redeploy gate everything else. Step 4 must exist before real AI traffic
(no backfill). Steps 5–6 need post-redeploy traffic to show data.

---

### Step 1 — Get the Measurement ID
GA4 → **Admin** → **Data streams** → web stream for onglessanssouci.com (create one if none) →
copy **Measurement ID**, form `G-XXXXXXX`.

- Must match `^G-[A-Z0-9][A-Z0-9-]*$` (`src/components/Analytics.tsx:21` — `GA_ID_PATTERN`).
  Standard `G-` IDs pass. Malformed IDs make the component render null (GA silently off).
- This ID is a public client-side identifier by design — safe to expose in the bundle.

### Step 2 — Set env var in Dokploy, then rebuild
Dokploy → SS-website → **Environment** → add:

```
NEXT_PUBLIC_GA_ID=G-XXXXXXX
```

Then **trigger a redeploy**.

- ⚠ Build-time var (`NEXT_PUBLIC_*` is baked into the bundle at build). The current live build
  has GA off — nothing fires until you redeploy after setting this.
- Ref: `src/components/Analytics.tsx:24` (`process.env.NEXT_PUBLIC_GA_ID`).

### Step 3 — Verify GA loads (after redeploy)
On the live site, Accept the consent bar, then in DevTools console:

- `typeof window.gtag` → `"function"`
- Network shows `googletagmanager.com/gtag/js?id=G-...`
- **Before** Accept: no `gtag`, no GA request (consent gate — `track()` returns early unless
  `ss_consent=granted`; `src/lib/analytics.ts`).

### Step 4 — AI-referrer custom channel group
GA4 → **Admin** → **Data display** → **Channel groups** → **Create new channel group**.

- Name: `AI Assistants (custom)`
- Add a channel and **drag it to the TOP** (evaluated before Organic/Referral):
  - Channel name: `AI Assistants`
  - Condition: **Session source** → `matches regex` →

    ```
    (chatgpt|openai|perplexity|claude\.ai|gemini\.google|copilot\.microsoft|bing\.com/chat).*
    ```

- Save. ⚠ **No backfill** — only traffic after creation is bucketed. Create it now.
- Canonical regex source: `03-01-PLAN.md:81`, `03-VERIFICATION.md:141`. `openai` already
  covers `chat.openai.com` — do not add `|gpt` (over-captures any source containing "gpt").
- Stricter host-anchored variant available in `03-RESEARCH.md:406` if you prefer exact-host
  matching over substring.

### Step 5 — Mark Key events
GA4 → **Admin** → **Key events** (or **Events**). Mark as key event (create by exact name if
not yet listed). Names verified against `track()` calls in source:

```
generate_lead      ← contact form submit   (ContactForm.tsx:36, param: method:"contact_form")
phone_click        ← tap-to-call           (StickyCtaBar.tsx)
book_cta_click     ← booking CTA           (StickyCtaBar.tsx)
```

- Leave `web_vitals` as a **normal** event (metric, not conversion). Params:
  `metric_name`, `value`, `metric_rating`, `metric_id` (`WebVitalsReporter.tsx:34-37`).

### Step 6 — Live verify
GA4 → **Admin** → **DebugView** (or **Reports → Realtime**). On the site, consent Accepted:

- Land → exactly one `page_view` (fires only after Accept — `send_page_view:false` at config,
  manual `page_view` in `grantConsent()`; `Analytics.tsx:78`, `analytics.ts:67`).
- Tap call / book CTA / submit contact form → `phone_click` / `book_cta_click` / `generate_lead`.
- `web_vitals` events arrive with the four params above.

### Step 7 — Refine regex (after first AI traffic)
The channel-group regex is a first guess (no-backfill item; `03-RESEARCH.md`). Once real AI
sessions land: GA4 → **Realtime → Acquisition**, inspect actual source strings
(`chatgpt.com` vs `chat.openai.com`, Copilot via `bing.com`) and tune the regex if it misses
or over-captures.

---

## Quick reference — exact strings

| Thing | Value |
|-------|-------|
| Env var | `NEXT_PUBLIC_GA_ID=G-XXXXXXX` (build-time, redeploy) |
| ID format | `^G-[A-Z0-9][A-Z0-9-]*$` |
| Channel regex | `(chatgpt\|openai\|perplexity\|claude\.ai\|gemini\.google\|copilot\.microsoft\|bing\.com/chat).*` |
| Key events | `generate_lead`, `phone_click`, `book_cta_click` |
| Normal event | `web_vitals` (params: `metric_name`, `value`, `metric_rating`, `metric_id`) |
