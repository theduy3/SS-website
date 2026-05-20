# Spec: Pop-up widget system (promotions & news)

> Task slug: **popup-widget-system**. Consumed by `/s1-new-task`.

## Context

The store wants to run timed promotions and post news via a pop-up on the site,
managed **without editing code or redeploying**. The admin UI, content authoring,
photo upload, and auth live in the **owner's separate app** — this Next site is a
**consumer**: it fetches the currently-active pop-up and renders it. The site is a
static, bilingual (EN/FR) Next 16 App Router app; pop-ups must respect that.

A pop-up has one of two content types:
- **rich** — structured promo: cover photo + bilingual title/body + optional CTA.
- **embed** — a custom HTML/script snippet (the owner's own widget, e.g. a
  newsletter signup from their app), rendered isolated.

## Goal / success criteria

- A visitor to any page may see one active pop-up appropriate to their locale.
- Owner controls it entirely from their app (data feed); no redeploy of this site.
- Scheduling (start/end) and a frequency cap ("don't nag") work.
- Embedded third-party widget scripts run but are isolated from the site.
- Pages remain statically rendered; only the pop-up is dynamic (client fetch).
- Works before the owner's API exists, via a local JSON fallback.

## Scope

**In scope (this site):** the data contract, a server proxy route, the client
renderer (rich modal + sandboxed embed), scheduling/frequency logic, bilingual
rendering, local fallback, tests.

**Out of scope (owner's app):** admin UI, content authoring, photo upload, auth,
the scheduling editor. The newsletter/email capture is the owner's embedded
widget — not built here.

## Data contract

This site expects the source to return the **single active pop-up** (or `null`).
Owner implements an endpoint matching this shape; until then a local file mirrors it.

```jsonc
{
  "id": "spring-promo",          // stable id
  "version": 3,                   // bump to force re-show after an edit
  "type": "rich",                 // "rich" | "embed"
  "priority": 10,                 // higher wins when several are active
  "startsAt": "2026-06-01T00:00:00Z",  // ISO 8601 (UTC); null = no start bound
  "endsAt":   "2026-06-30T23:59:59Z",  // ISO 8601 (UTC); null = no end bound
  "frequency": "session",         // "once" | "session" | "daily" | "always"

  // type === "rich":
  "image": { "url": "https://…/cover.jpg", "alt": "…" } | null,
  "title": { "en": "…", "fr": "…" },
  "body":  { "en": "…", "fr": "…" },
  "cta":   { "label": { "en": "Book", "fr": "Réserver" }, "href": "/appointments" } | null,

  // type === "embed":
  "html": "<script src='https://yourapp/widget.js'></script>"
}
```

Validated with **zod** at the proxy boundary (existing dep). Invalid/empty → no pop-up.

## Files

- `src/lib/popup.ts` — zod schema, `Popup` type, `pickActive(popups, now)` (filters
  by start/end, returns highest `priority`), `localizePopup(popup, locale)`.
- `src/app/api/popups/route.ts` — GET handler. If `process.env.POPUP_SOURCE_URL`
  set → `fetch` it (server-side, `next: { revalidate: 60 }`); else read
  `src/data/popups.json`. Validate, run `pickActive`, return the active pop-up or
  `{ popup: null }`. Never leaks source errors to the client (logs server-side).
- `src/data/popups.json` — local fallback / dev fixture (array of records).
- `src/components/PopupHost.tsx` — client component. Fetches `/api/popups`, applies
  frequency cap (localStorage `popup:{id}:{version}`), renders the modal. Mounted
  once in `src/app/[lang]/layout.tsx`, receives `locale`.
- `src/components/PopupRich.tsx` — rich modal (next/image cover, locale title/body,
  optional CTA via existing `Button`, close affordances). B&W theme via tokens.
- `src/components/PopupEmbed.tsx` — renders `html` in a sandboxed `<iframe srcdoc>`
  (`sandbox="allow-scripts allow-popups allow-forms"`), auto-sized.
- `next.config.ts` — add the cover-image host(s) to `images.remotePatterns`.
- `env.example` — document `POPUP_SOURCE_URL` (optional).

Reuse existing: `Button` (`src/components/Button.tsx`), locale plumbing
(`src/lib/i18n.ts`), framer-motion (modal transitions, like `Reveal`).

## Behavior

- **Mount:** `PopupHost` in the locale layout → present site-wide. Fetch on mount.
- **Concurrency:** one pop-up at a time — `pickActive` returns the highest
  `priority` whose window contains `now`.
- **Frequency cap (client):** key `popup:{id}:{version}` in localStorage.
  `once`/`session` use sessionStorage-vs-localStorage semantics; `daily` stores a
  timestamp; `always` never suppresses. Editing → bump `version` → re-shows.
- **rich:** centered modal, overlay scrim, cover image on top, title/body in the
  active locale, optional CTA (internal href auto-prefixed `/{locale}` via Button),
  close X + overlay-click + Esc. Focus trap; `aria-modal`. Honors
  `prefers-reduced-motion` (no slide, instant).
- **embed:** sandboxed iframe runs the owner's widget; sized to content where
  possible, capped to viewport. No site JS/styles leak in or out.
- **Scheduling:** enforced server-side in the route (authoritative clock).
- **Static rendering preserved:** layout/pages stay static; the pop-up is a client
  fetch, so no page becomes dynamic.

## Edge cases / failure handling

- Source unreachable/invalid JSON/zod fail → route returns `{ popup: null }`, logs
  server-side; site renders normally (no pop-up). Never blocks page render.
- `rich` with missing `image` → modal renders text-only (image optional).
- `embed` html present but blank → iframe empty, still dismissible; no crash.
- Unknown locale fields missing → fall back to the other locale, then empty string.
- localStorage unavailable (privacy mode) → treat as "not seen", show once per load.

## Verification

1. `bun run build` — compiles; pages still SSG (no route turns dynamic).
2. Local fallback: populate `src/data/popups.json`; `next start`; load `/fr` and
   `/en` → rich modal shows in correct language; CTA routes to `/{locale}/…`.
3. Frequency: dismiss → reload → suppressed per `frequency`; bump `version` →
   re-shows.
4. Scheduling: set `endsAt` in the past → not shown; future `startsAt` → not shown.
5. Embed: a record with a `<script>` → renders in sandboxed iframe, executes,
   isolated (no style bleed); page has no console security errors.
6. Proxy: set `POPUP_SOURCE_URL` to a stub returning the contract → route serves it;
   set to a 500 → site renders with no pop-up, error logged server-side.
7. `bun run test:e2e` — new `e2e/popup.spec.ts` (rich show/dismiss + frequency cap,
   embed iframe `sandbox` attr present, expired hidden, bilingual), and the
   existing 22 specs stay green.

## Open items for the owner (non-blocking)
- Provide `POPUP_SOURCE_URL` + confirm the endpoint matches the contract.
- Provide the cover-image host domain(s) for `next.config` `remotePatterns`.
