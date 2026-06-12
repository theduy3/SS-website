# Spec: `/clientportal` page

**Status:** spec
**Date:** 2026-06-12
**Author:** theduy + Claude

## Problem

The SalonX client-account widget is distributed as:

```html
<script
  src="https://app.onglessanssouci.com/widgets/client-account-widget.js"
  data-account-store="SS"
></script>
```

There is **no page on the site that hosts it.** Verified: only `/checkin` and
`/queue` standalone kiosk pages exist; no `/clientportal`, no `client-account`
component. This spec adds a `/clientportal` page that embeds the widget, mirroring
the existing `/checkin` pattern.

## Findings (from fetching the real widget JS, 235KB)

| Aspect | `/checkin` (existing) | client-account-widget (new) |
|---|---|---|
| Embed attribute | `data-store="SS"` | **`data-account-store="SS"`** ← differs |
| Mounts | in-place next to its `<script>` | in-place — `insertBefore(div, script.nextSibling)` ✅ same |
| Theme | light | light (`#fff`, indigo `#6366f1`) ✅ same |
| Reads `data-lang` | no | yes (optional) — **not set**, per decision below |
| Script self-lookup | — | `querySelectorAll("script[data-account-store]")`, takes last match |
| Mount node id | — | `#salonx-account-widget` |

**Implication:** the widget locates its own `<script>` by querying for
`script[data-account-store]` (with `document.currentScript` only as fallback —
which is `null` for async-injected scripts). So `WidgetEmbed`'s dynamic injection
works **only if the injected script carries `data-account-store`.** `WidgetEmbed`
currently hardcodes `data-store`, so it must be made attribute-name-aware.

Because the widget mounts in-place (not appended to `<body>`), the dark
collapse-height hack used by `/queue` is **not** needed here — light theme,
in-place, identical to `/checkin`.

## Decisions

- **Localization:** un-localized, no `data-lang` — match `/checkin`/`/queue`
  exactly. Widget uses its own default language. (Chosen over fixed `data-lang`
  or a `/[lang]/clientportal` localized route.)
- **Route:** `/clientportal` (single word, no hyphen — matches `/checkin`, `/queue`).
- **Indexing:** noindex/nofollow — private customer account surface, no SEO value.
- **WidgetEmbed change:** add an optional `storeAttr` prop defaulting to
  `"data-store"` (Approach A). Backward-compatible; checkin/queue callers
  unchanged. Rejected: generic `dataAttrs` map (YAGNI, rewrites all callers);
  duplicate embed component (drift risk).

## Scope

### Files to create

1. **`src/components/ClientPortalWidget.tsx`** — clone of `CheckinWidget.tsx`:
   - `WIDGET_SRC = "https://app.onglessanssouci.com/widgets/client-account-widget.js"`
   - `STORE = "SS"`
   - renders `<WidgetEmbed src={WIDGET_SRC} store={STORE} storeAttr="data-account-store" fallbackLabel="client portal" />`
   - light theme (default — no `theme` prop)

2. **`src/app/clientportal/page.tsx`** — clone of `src/app/checkin/page.tsx`:
   - renders `<ClientPortalWidget />`
   - metadata lives in sibling layout

3. **`src/app/clientportal/layout.tsx`** — clone of `src/app/checkin/layout.tsx`:
   - `import "../globals.css"`
   - `metadata = { title: "Account", robots: { index: false, follow: false } }`
   - `<html lang="en">`, `<body className="min-h-screen bg-fog text-espresso">`
   - no Header/Footer/popups

### Files to edit

4. **`src/components/WidgetEmbed.tsx`** — make the store attribute configurable:
   - Add prop `storeAttr?: string` defaulting to `"data-store"`.
   - Change `script.setAttribute("data-store", store)` →
     `script.setAttribute(storeAttr, store)`.
   - Add `storeAttr` to the `useEffect` dependency array.
   - Update the leading JSDoc comment to note the account widget uses
     `data-account-store`.
   - **No behavioral change** for `/checkin` and `/queue` (they omit `storeAttr`
     → default `"data-store"`).

## Data flow

```
/clientportal
  → layout.tsx (noindex shell, light body)
    → page.tsx
      → ClientPortalWidget
        → WidgetEmbed (src, store="SS", storeAttr="data-account-store")
          → injects <script src=… data-account-store="SS"> into ref'd container
            → widget's querySelectorAll("script[data-account-store]") finds it
              → renders #salonx-account-widget in-place
```

Loading spinner, error fallback + retry: unchanged, inherited from `WidgetEmbed`.

## Must-Haves (truth contract)

- **T1** — Navigating to `/clientportal` renders the client-account widget
  (`#salonx-account-widget` present after script load).
- **T2** — The injected `<script>` carries `data-account-store="SS"` (NOT
  `data-store`), so the widget's self-lookup succeeds.
- **T3** — `/checkin` and `/queue` are unaffected: their injected scripts still
  carry `data-store="SS"` (default `storeAttr`).
- **T4** — `/clientportal` is noindex/nofollow (`robots` meta) and standalone
  (no Header/Footer/popups).
- **T5** — Loading and error+retry states work (inherited `WidgetEmbed` overlay).

## Testing

- **Unit — `ClientPortalWidget`:** renders `WidgetEmbed` with `src` =
  client-account URL, `store="SS"`, `storeAttr="data-account-store"`,
  `fallbackLabel="client portal"`. (→ T1, T2)
- **Unit — `WidgetEmbed`:** given `storeAttr="data-account-store"`, the injected
  script element has attribute `data-account-store` = store value and does NOT
  have `data-store`; given no `storeAttr`, it sets `data-store` (regression
  guard). (→ T2, T3)
- **Manual:** `/clientportal` loads → spinner → widget ready; kill network →
  error + Retry recovers; view-source shows `robots noindex`. (→ T4, T5)

## Out of scope

- Authentication / session handling (the widget owns its own auth).
- Localized `/[lang]/clientportal` route or `data-lang`.
- Header/Footer/popup chrome.
- Any change to the widget bundle itself (third-party).

## Risks

- Widget could change its self-lookup attribute upstream — out of our control;
  T2 test pins the contract on our side.
- If `client-account-widget.js` is region/auth-gated, manual verification may
  need a logged-in context; unit tests still pass (they assert the embed, not the
  widget's internal render).
