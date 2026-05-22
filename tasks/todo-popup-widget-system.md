<!-- s1 metadata
task-name: popup-widget-system
scope: medium
status: plan-approved
repo: /Users/theduy/Repo/SS-website
created-at: 2026-05-20
worktree: popup-widget-system
-->

# Pop-up Widget System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ⛔ **PREREQUISITE (blocked):** Do NOT start until the in-flight **4-locale refactor (es/ar)** is finished and committed and `bun run build` is green off a clean base. As of 2026-05-20 the working tree did not compile: `src/app/[lang]/dictionaries.ts` mapped only `en`/`fr` while `Locale` includes `es`/`ar`, and `es.json`/`ar.json` were missing. Execution chosen: **commit clean 4-locale base → create worktree `popup-widget-system` → subagent-driven-development.**

**Goal:** Render one active promo/news pop-up (rich or embedded-widget) on the site, fed by a data contract this site consumes from the owner's app, with scheduling + frequency cap, multilingual, isolated embeds.

**Architecture:** A server route (`/api/popups`) returns the single active pop-up — from `POPUP_SOURCE_URL` if set, else a committed local fixture — validated with zod and filtered by schedule/priority. A client `PopupHost` mounted in the locale layout fetches it, applies a localStorage/sessionStorage frequency cap, and renders either a styled rich modal or a sandboxed `<iframe srcdoc>` for embed widgets. Pages stay statically rendered; only the API route is dynamic.

**Tech Stack:** Next 16 App Router, React 19, zod v4, framer-motion, Tailwind v4 tokens, Playwright (single test runner — no unit runner in repo).

**Locales:** Site supports `en, fr, es, ar` (`src/lib/i18n.ts`; `fr` default; `ar` is RTL via `dirFor`). Pop-up text: **en/fr required, es/ar optional**, with fallback `locale → fr → en`.

---

## File Structure

- `src/lib/popup.ts` (create) — zod schema (discriminated union rich|embed), `Popup` type, `pickActive(popups, now)`, `pickText(localized, locale)`. Pure logic.
- `src/data/popups.json` (create) — committed fallback/fixture: array of records exercising scheduling + priority.
- `src/app/api/popups/route.ts` (create) — GET; source = `POPUP_SOURCE_URL` else fixture; zod validate; `pickActive`; returns `{ popup }`.
- `src/components/PopupEmbed.tsx` (create) — sandboxed iframe for `html`.
- `src/components/PopupRich.tsx` (create) — rich modal body (image + title/body + CTA).
- `src/components/PopupHost.tsx` (create) — client; fetch, frequency cap, overlay/modal shell, a11y, renders rich|embed.
- `src/app/[lang]/layout.tsx` (modify) — mount `<PopupHost locale={lang} />`.
- `next.config.ts` (modify) — add `images.remotePatterns` for cover-image host.
- `env.example` (modify) — document `POPUP_SOURCE_URL`.
- `e2e/popup-api.spec.ts` (create) — route logic (active selection, schedule, null).
- `e2e/popup.spec.ts` (create) — UI: rich show/dismiss, frequency cap, embed sandbox, locale.

Reuse: `Button` (`src/components/Button.tsx`), `Locale`/`isLocale`/`defaultLocale` (`src/lib/i18n.ts`), framer-motion.

---

## Task 1: Popup schema + pure logic

**Files:**
- Create: `src/lib/popup.ts`

- [ ] **Step 1: Implement schema + helpers**

zod v4: use `z.url()` (matches `z.email()` in `src/app/api/contact/route.ts`). Datetime kept lenient (plain string + `Date.parse`). `Localized` requires en/fr, es/ar optional — tracks the 4-locale site; `pickText` falls back `locale → fr → en`.

```ts
import { z } from "zod";
import { defaultLocale, type Locale } from "@/lib/i18n";

// en/fr always present; es/ar optional (owner's app may not translate all).
const Localized = z.object({
  en: z.string(),
  fr: z.string(),
  es: z.string().optional(),
  ar: z.string().optional(),
});

const Base = z.object({
  id: z.string().min(1),
  version: z.number().int().nonnegative().default(0),
  priority: z.number().int().default(0),
  startsAt: z.string().nullable().default(null), // ISO; null = no bound
  endsAt: z.string().nullable().default(null),
  frequency: z.enum(["once", "session", "daily", "always"]).default("session"),
});

const RichPopup = Base.extend({
  type: z.literal("rich"),
  image: z.object({ url: z.url(), alt: z.string().default("") }).nullable().default(null),
  title: Localized,
  body: Localized,
  cta: z.object({ label: Localized, href: z.string().min(1) }).nullable().default(null),
});

const EmbedPopup = Base.extend({
  type: z.literal("embed"),
  html: z.string().min(1),
});

export const PopupSchema = z.discriminatedUnion("type", [RichPopup, EmbedPopup]);
export const PopupsSchema = z.array(PopupSchema);
export type Popup = z.infer<typeof PopupSchema>;

// Highest-priority pop-up whose [startsAt, endsAt] window contains `now`.
export function pickActive(popups: Popup[], now: Date): Popup | null {
  const t = now.getTime();
  const active = popups.filter((p) => {
    const startOk = !p.startsAt || Date.parse(p.startsAt) <= t;
    const endOk = !p.endsAt || Date.parse(p.endsAt) >= t;
    return startOk && endOk;
  });
  if (active.length === 0) return null;
  return [...active].sort((a, b) => b.priority - a.priority)[0];
}

// Locale text with fallback: requested → default (fr) → en → empty.
export function pickText(text: Partial<Record<Locale, string>>, locale: Locale): string {
  return text[locale] || text[defaultLocale] || text.en || "";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/popup.ts
git commit -m "feat(popup): schema, pickActive, pickText (4-locale aware)"
```

(Pure logic verified through the route tests in Task 3 — single test runner.)

---

## Task 2: Local fixture

**Files:**
- Create: `src/data/popups.json`

- [ ] **Step 1: Write fixture (schedule + priority). es/ar optional, omitted here.**

```json
[
  {
    "id": "promo-active",
    "version": 1,
    "type": "rich",
    "priority": 10,
    "startsAt": null,
    "endsAt": null,
    "frequency": "session",
    "image": null,
    "title": { "en": "Spring Special", "fr": "Spécial printemps" },
    "body": { "en": "15% off your next visit.", "fr": "15 % de rabais sur votre prochaine visite." },
    "cta": { "label": { "en": "Book now", "fr": "Réserver" }, "href": "/appointments" }
  },
  {
    "id": "embed-low",
    "version": 1,
    "type": "embed",
    "priority": 1,
    "startsAt": null,
    "endsAt": null,
    "frequency": "session",
    "html": "<p>widget</p>"
  },
  {
    "id": "expired",
    "version": 1,
    "type": "rich",
    "priority": 99,
    "startsAt": "2000-01-01T00:00:00Z",
    "endsAt": "2000-01-02T00:00:00Z",
    "frequency": "always",
    "image": null,
    "title": { "en": "Old", "fr": "Vieux" },
    "body": { "en": "x", "fr": "x" },
    "cta": null
  },
  {
    "id": "future",
    "version": 1,
    "type": "rich",
    "priority": 99,
    "startsAt": "2999-01-01T00:00:00Z",
    "endsAt": null,
    "frequency": "always",
    "image": null,
    "title": { "en": "Soon", "fr": "Bientôt" },
    "body": { "en": "x", "fr": "x" },
    "cta": null
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add src/data/popups.json
git commit -m "feat(popup): local fixture data"
```

---

## Task 3: API route (test-first)

**Files:**
- Create: `e2e/popup-api.spec.ts`
- Create: `src/app/api/popups/route.ts`

- [ ] **Step 1: Failing API test**

```ts
import { test, expect } from "@playwright/test";

test.describe("/api/popups", () => {
  test("returns the highest-priority active pop-up from the fixture", async ({ request }) => {
    const res = await request.get("/api/popups");
    expect(res.ok()).toBeTruthy();
    const { popup } = await res.json();
    expect(popup).not.toBeNull();
    expect(popup.id).toBe("promo-active"); // priority 10, active; excludes expired/future/low
  });

  test("response shape carries type + version", async ({ request }) => {
    const { popup } = await (await request.get("/api/popups")).json();
    expect(popup.type).toBe("rich");
    expect(typeof popup.version).toBe("number");
  });
});
```

- [ ] **Step 2: Run, verify fails** — `bunx playwright test e2e/popup-api.spec.ts` → FAIL (404).

- [ ] **Step 3: Implement route** (static JSON import — works in `next start`/serverless)

```ts
import { NextResponse } from "next/server";
import fallback from "@/data/popups.json";
import { PopupsSchema, pickActive } from "@/lib/popup";

export async function GET() {
  let raw: unknown = fallback;

  const url = process.env.POPUP_SOURCE_URL;
  if (url) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (res.ok) raw = await res.json();
      else console.error(`[popups] source responded ${res.status}`);
    } catch (err) {
      console.error("[popups] source fetch failed:", err);
    }
  }

  const parsed = PopupsSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[popups] invalid data:", parsed.error.issues[0]?.message);
    return NextResponse.json({ popup: null });
  }
  return NextResponse.json({ popup: pickActive(parsed.data, new Date()) });
}
```

- [ ] **Step 4: Run, verify passes** — `bunx playwright test e2e/popup-api.spec.ts` → PASS (2).

- [ ] **Step 5: Commit**

```bash
git add e2e/popup-api.spec.ts src/app/api/popups/route.ts
git commit -m "feat(popup): /api/popups route with schedule + priority selection"
```

---

## Task 4: PopupEmbed + PopupRich components

**Files:**
- Create: `src/components/PopupEmbed.tsx`
- Create: `src/components/PopupRich.tsx`

- [ ] **Step 1: PopupEmbed — sandboxed iframe**

```tsx
"use client";

// Owner-supplied HTML (their widget) inside a sandboxed iframe: scripts run but
// stay isolated from the site (no style/JS bleed).
export function PopupEmbed({ html }: { html: string }) {
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:system-ui,sans-serif}</style></head>
<body>${html}</body></html>`;
  return (
    <iframe
      title="promotion"
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
      className="h-[60vh] max-h-[600px] w-full border-0"
    />
  );
}
```

- [ ] **Step 2: PopupRich — image + text + CTA**

```tsx
"use client";

import Image from "next/image";
import { Button } from "@/components/Button";
import { pickText, type Popup } from "@/lib/popup";
import type { Locale } from "@/lib/i18n";

export function PopupRich({
  popup,
  locale,
  onClose,
}: {
  popup: Extract<Popup, { type: "rich" }>;
  locale: Locale;
  onClose: () => void;
}) {
  const href =
    popup.cta && /^https?:\/\//.test(popup.cta.href)
      ? popup.cta.href
      : popup.cta
        ? `/${locale}${popup.cta.href}`
        : null;

  return (
    <div className="overflow-hidden rounded-2xl bg-cream">
      {popup.image && (
        <div className="relative aspect-[16/9] w-full">
          <Image src={popup.image.url} alt={popup.image.alt} fill sizes="(max-width:768px) 100vw, 480px" className="object-cover" />
        </div>
      )}
      <div className="p-8 text-center">
        <h2 className="text-2xl text-espresso md:text-3xl">{pickText(popup.title, locale)}</h2>
        <p className="mt-4 leading-relaxed text-mocha">{pickText(popup.body, locale)}</p>
        {href && popup.cta && (
          <div className="mt-6">
            <Button href={href} variant="solid">{pickText(popup.cta.label, locale)}</Button>
          </div>
        )}
        <button onClick={onClose} className="mt-6 text-xs uppercase tracking-widest text-mocha underline">
          Close
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PopupEmbed.tsx src/components/PopupRich.tsx
git commit -m "feat(popup): rich + sandboxed-embed render components"
```

---

## Task 5: PopupHost (client) + mount, test-first

**Files:**
- Create: `e2e/popup.spec.ts`
- Create: `src/components/PopupHost.tsx`
- Modify: `src/app/[lang]/layout.tsx`

- [ ] **Step 1: Failing UI test** (`PopupHost` fetches client-side → `page.route` stubs work)

```ts
import { test, expect } from "@playwright/test";

const rich = (over = {}) => ({
  popup: {
    id: "t", version: 1, type: "rich", priority: 1,
    startsAt: null, endsAt: null, frequency: "session",
    image: null,
    title: { en: "Hello promo", fr: "Bonjour promo" },
    body: { en: "Body en", fr: "Corps fr" },
    cta: { label: { en: "Book", fr: "Réserver" }, href: "/appointments" },
    ...over,
  },
});

test("rich pop-up shows in the active locale and dismisses", async ({ page }) => {
  await page.route("**/api/popups*", (r) => r.fulfill({ json: rich() }));
  await page.goto("/fr");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Bonjour promo")).toBeVisible();
  await page.getByRole("button", { name: /close/i }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("frequency cap suppresses on reload (session)", async ({ page }) => {
  await page.route("**/api/popups*", (r) => r.fulfill({ json: rich() }));
  await page.goto("/en");
  await page.getByRole("button", { name: /close/i }).click();
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("embed renders in a sandboxed iframe", async ({ page }) => {
  await page.route("**/api/popups*", (r) =>
    r.fulfill({ json: { popup: { id: "e", version: 1, type: "embed", priority: 1, startsAt: null, endsAt: null, frequency: "always", html: "<p>widget-here</p>" } } }),
  );
  await page.goto("/fr");
  const frame = page.locator('iframe[title="promotion"]');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute("sandbox", /allow-scripts/);
});

test("no pop-up when API returns null", async ({ page }) => {
  await page.route("**/api/popups*", (r) => r.fulfill({ json: { popup: null } }));
  await page.goto("/fr");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
```

- [ ] **Step 2: Run, verify fails** — `bunx playwright test e2e/popup.spec.ts` → FAIL.

- [ ] **Step 3: Implement PopupHost**

```tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Popup } from "@/lib/popup";
import type { Locale } from "@/lib/i18n";
import { PopupRich } from "./PopupRich";
import { PopupEmbed } from "./PopupEmbed";

const seenKey = (p: Popup) => `popup:${p.id}:${p.version}`;

function shouldShow(p: Popup): boolean {
  if (p.frequency === "always") return true;
  try {
    const key = seenKey(p);
    if (p.frequency === "daily") {
      const last = Number(localStorage.getItem(key) ?? 0);
      return Date.now() - last > 86_400_000;
    }
    const store = p.frequency === "session" ? sessionStorage : localStorage;
    return !store.getItem(key);
  } catch {
    return true; // storage blocked → show once this load
  }
}

function markSeen(p: Popup) {
  try {
    if (p.frequency === "always") return;
    if (p.frequency === "daily") localStorage.setItem(seenKey(p), String(Date.now()));
    else (p.frequency === "session" ? sessionStorage : localStorage).setItem(seenKey(p), "1");
  } catch {
    /* ignore */
  }
}

export function PopupHost({ locale }: { locale: Locale }) {
  const [popup, setPopup] = useState<Popup | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    let alive = true;
    fetch("/api/popups")
      .then((r) => r.json())
      .then((d: { popup: Popup | null }) => {
        if (!alive || !d.popup || !shouldShow(d.popup)) return;
        setPopup(d.popup);
        markSeen(d.popup);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!popup) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPopup(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [popup]);

  const close = () => setPopup(null);

  return (
    <AnimatePresence>
      {popup && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-espresso/60 p-4"
          onClick={close}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <motion.div
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: reduce ? 1 : 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: reduce ? 1 : 0.96, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
          >
            {popup.type === "rich" ? (
              <PopupRich popup={popup} locale={locale} onClose={close} />
            ) : (
              <div className="overflow-hidden rounded-2xl bg-cream">
                <PopupEmbed html={popup.html} />
                <button onClick={close} className="block w-full py-3 text-xs uppercase tracking-widest text-mocha underline">
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Mount in the locale layout**

In `src/app/[lang]/layout.tsx`, import `PopupHost` and render after `<Footer dict={dict} />` (inside `<body>`):

```tsx
import { PopupHost } from "@/components/PopupHost";
// ...
        <Footer dict={dict} />
        <PopupHost locale={lang} />
      </body>
```

- [ ] **Step 5: Run, verify passes** — `bunx playwright test e2e/popup.spec.ts` → PASS (4).

- [ ] **Step 6: Commit**

```bash
git add e2e/popup.spec.ts src/components/PopupHost.tsx "src/app/[lang]/layout.tsx"
git commit -m "feat(popup): PopupHost modal with frequency cap, a11y, mount in layout"
```

---

## Task 6: Image host config + env docs

**Files:**
- Modify: `next.config.ts`
- Modify: `env.example`

- [ ] **Step 1: Add images.remotePatterns** (merge into existing `nextConfig`, keep `headers()`)

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // TODO(owner): set to the real cover-image host.
      { protocol: "https", hostname: "app.onglessanssouci.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
```

- [ ] **Step 2: Document env var** — append to `env.example`:

```
# Optional: URL of the owner's app endpoint returning the pop-up array
# (see tasks/spec-popup-widget-system.md for the contract). Unset = local
# src/data/popups.json fallback is used.
POPUP_SOURCE_URL=
```

- [ ] **Step 3: Commit**

```bash
git add next.config.ts env.example
git commit -m "chore(popup): allow cover-image host, document POPUP_SOURCE_URL"
```

---

## Task 7: Full verification

- [ ] **Step 1: Build** — `bun run build` → compiles; pages still SSG; `/api/popups` dynamic (ƒ).
- [ ] **Step 2: Full E2E** — `bun run test:e2e` → new popup-api (2) + popup (4) pass; existing specs stay green.
- [ ] **Step 3: Manual** — `./node_modules/.bin/next start --port 3000`; `/fr` and `/en` show rich modal in correct language, CTA → `/{locale}/appointments`, dismiss, reload suppresses; flip a fixture record to `type:"embed"` → iframe renders.

---

## Self-Review
- Spec coverage: contract (T1), route+env+fallback (T3), rich+embed (T4), host/frequency/a11y/scheduling (T3,T5), image host+env (T6), tests incl. embed sandbox + expired-hidden + null + locale (T3,T5). ✓
- Placeholder scan: none (only the owner's real image host TODO, flagged). ✓
- Type consistency: `pickActive`/`pickText`/`Popup`/`PopupHost`/`PopupRich`/`PopupEmbed` and props consistent. ✓
- Convention match: single Playwright runner; zod v4 `z.url()`; Button + framer-motion reused; 4-locale aware. ✓

## Open items for the owner (non-blocking)
- Provide `POPUP_SOURCE_URL` + endpoint matching the contract (`tasks/spec-popup-widget-system.md`).
- Provide real cover-image host for `next.config` `images.remotePatterns`.
