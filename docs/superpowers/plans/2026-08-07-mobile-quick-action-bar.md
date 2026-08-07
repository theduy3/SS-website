# Mobile Quick-Action Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible, localized three-action mobile bar with Call Now, raised Book Now, and Directions to every public localized page except the booking page.

**Architecture:** Mount the existing client-side `StickyCtaBar` once from `src/app/[lang]/layout.tsx`. The component will use the current pathname to exclude `/{locale}/appointments`, a consent-change browser event to appear immediately after Accept or Decline, and a mobile spacer to keep fixed actions from covering page content. Existing page-level mounts will be removed.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Next `Link`, Vitest + Testing Library, Playwright, and the existing GA4 helper in `src/lib/analytics.ts`.

## Global Constraints

- Use the existing `StickyCtaBar`; do not introduce a new dependency or icon package.
- Keep the bar mobile-only with `md:hidden`, fixed at the bottom at `z-40`, below the header (`z-50`) and popup layer (`z-[100]`).
- Exclude only the rendered localized booking path `/{locale}/appointments` (with or without a trailing slash) from the public localized layout.
- Preserve the existing consent semantics: the CTA is hidden until a consent decision exists; Accept grants analytics, Decline denies analytics; `track()` remains consent-gated.
- Add `site.contact.directionsHref` using the existing Google Maps URL; do not read the URL from `socialProfiles[2]` in the component.
- Add the exact localized Directions labels: `Directions`, `Itinéraire`, `Cómo llegar`, and `الاتجاهات`.
- Use native `<a>` or Next `<Link>` elements for all three actions; icons are inline SVG with `aria-hidden`.
- Keep each action keyboard/finger accessible with a minimum 44px target and visible focus styling.
- Do not modify `Button.tsx`; the new bar owns its icon-first link styling.
- Tracking must never block navigation and must send no phone number, map URL, identity, or other personal data.
- Keep `TrustBand.tsx` and its existing tests unchanged.
- Do not stage or modify the pre-existing user file `tasks/human-tasks.md`.

## File Map

### Create

- `src/lib/consent.test.ts` — verifies the client consent-change event helper.
- `src/components/StickyCtaBar.test.tsx` — verifies visibility, route exclusion, links, tracking, RTL, and consent-event behavior.
- `e2e/mobile-quick-action-bar.spec.ts` — verifies public-page, booking-page, consent, desktop, RTL, and content-clearance behavior at browser level.

### Modify

- `src/lib/site.ts` — add the dedicated Google Maps destination.
- `src/lib/site.test.ts` — pin the dedicated destination to the existing map profile URL.
- `src/dictionaries/en.json` — add the English Directions label.
- `src/dictionaries/fr.json` — add the French Directions label.
- `src/dictionaries/es.json` — add the Spanish Directions label.
- `src/dictionaries/ar.json` — add the Arabic Directions label.
- `src/lib/i18n.test.ts` — assert every supported dictionary has a non-empty Directions label.
- `src/lib/analytics.ts` — add `directions_click` to `GaEvent`.
- `src/lib/analytics.test.ts` — verify the new event uses the existing consent guard.
- `src/lib/consent.ts` — add the named consent-change event and dispatcher.
- `src/components/ConsentBar.tsx` — dispatch the event after either consent choice is written.
- `src/components/ConsentBar.test.tsx` — verify both decisions notify the CTA surface.
- `src/components/StickyCtaBar.tsx` — replace the two-button bar with the three-action accessible design.
- `src/app/[lang]/layout.tsx` — mount the bar once after the footer, passing the existing locale, dictionary, and consent state.
- `src/app/[lang]/page.tsx` — remove the page-level CTA wrapper and duplicate bottom padding.
- `src/app/[lang]/services/[slug]/page.tsx` — remove the page-level CTA wrapper and duplicate bottom padding.
- `src/components/RelatedServiceLink.tsx` — remove the stale comment reference to `KeyPageChrome`.

### Delete

- `src/components/KeyPageChrome.tsx` — no production caller enables its trust-band branch, and the CTA moves to the localized layout.

---

### Task 1: Add Directions data, translations, and analytics contract

**Files:**
- Modify: `src/lib/site.ts:20-29,55-70`
- Modify: `src/lib/site.test.ts`
- Modify: `src/dictionaries/en.json:36-45`
- Modify: `src/dictionaries/fr.json:36-45`
- Modify: `src/dictionaries/es.json:36-45`
- Modify: `src/dictionaries/ar.json:36-45`
- Modify: `src/lib/i18n.test.ts`
- Modify: `src/lib/analytics.ts:18-25`
- Modify: `src/lib/analytics.test.ts:80-100`

**Interfaces:**
- Produces `site.contact.directionsHref: string`, equal to the existing Google Maps URL currently stored at `site.socialProfiles[2]`.
- Produces `dict.cta.directions: string` for every supported locale.
- Produces the valid analytics event name `directions_click` for `track()`.

- [ ] **Step 1: Write the failing data and analytics tests.**

In `src/lib/site.test.ts`, import `site` and add a semantic-source test so the component does not depend on array position:

```ts
it("exposes the existing Google Maps URL as a dedicated directions destination", () => {
  expect(site.contact.directionsHref).toBe(site.socialProfiles[2]);
});
```

In `src/lib/i18n.test.ts`, import the four JSON dictionaries and add:

```ts
const dictionaries = { en, fr, es, ar } as const;

for (const locale of ["en", "fr", "es", "ar"] as const) {
  it(`has a non-empty Directions label for ${locale}`, () => {
    expect(dictionaries[locale].cta.directions.trim()).not.toBe("");
  });
}
```

In `src/lib/analytics.test.ts`, add a granted-consent case that calls `track("directions_click")` and expects `window.gtag` to receive `("event", "directions_click", undefined)`.

- [ ] **Step 2: Run the focused tests and confirm they fail for missing contracts.**

Run:

```bash
bun run test -- src/lib/site.test.ts src/lib/i18n.test.ts src/lib/analytics.test.ts
```

Expected: TypeScript/test failures for the missing `directionsHref`, dictionary key, and `GaEvent` member.

- [ ] **Step 3: Add the minimal data and event definitions.**

In `src/lib/site.ts`, define the map URL once before `site` and reuse it in both places so the canonical data is not duplicated:

```ts
const directionsHref = "https://maps.app.goo.gl/wNJvwCYG4fShGckBA";

// Inside `site.socialProfiles`, replace the existing third URL with:
directionsHref,

// Inside `site.contact`, add alongside `phoneHref`:
directionsHref,
```

Add only the new `directions` key to each locale's existing `cta` object:

```json
"directions": "Directions"
```

Use these exact values:

```text
en: Directions
fr: Itinéraire
es: Cómo llegar
ar: الاتجاهات
```

Extend `GaEvent` with `| "directions_click"` and leave all existing event names untouched.

- [ ] **Step 4: Run the focused tests and confirm they pass.**

Run:

```bash
bun run test -- src/lib/site.test.ts src/lib/i18n.test.ts src/lib/analytics.test.ts
```

Expected: PASS for all listed files.

- [ ] **Step 5: Commit the data contract.**

```bash
git add src/lib/site.ts src/lib/site.test.ts src/lib/i18n.test.ts src/lib/analytics.ts src/lib/analytics.test.ts src/dictionaries/en.json src/dictionaries/fr.json src/dictionaries/es.json src/dictionaries/ar.json
git commit -m "feat: add mobile directions CTA data"
```

---

### Task 2: Add the consent-decision signal

**Files:**
- Create: `src/lib/consent.test.ts`
- Modify: `src/lib/consent.ts:10-20`
- Modify: `src/components/ConsentBar.tsx:17-21,60-70`
- Modify: `src/components/ConsentBar.test.tsx:10-40,68-90`

**Interfaces:**
- Produces `SS_CONSENT_CHANGED_EVENT = "ss-consent-changed"`.
- Produces `notifyConsentChanged(): void`, which dispatches `new Event(SS_CONSENT_CHANGED_EVENT)` on `window`.
- `ConsentBar` calls `notifyConsentChanged()` after writing either `granted` or `denied`.

- [ ] **Step 1: Write the failing consent-event tests.**

Create `src/lib/consent.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { notifyConsentChanged, SS_CONSENT_CHANGED_EVENT } from "./consent";

describe("notifyConsentChanged", () => {
  it("dispatches the shared consent event", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");

    notifyConsentChanged();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: SS_CONSENT_CHANGED_EVENT }),
    );
    dispatch.mockRestore();
  });
});
```

Update the `@/lib/consent` mock in `ConsentBar.test.tsx` to export the event constant and a `notifyConsentChanged` spy. Add one Accept test and one Decline test that assert the spy is called once after the corresponding button is clicked, while retaining the existing cookie and analytics assertions.

- [ ] **Step 2: Run the focused tests and confirm they fail.**

Run:

```bash
bun run test -- src/lib/consent.test.ts src/components/ConsentBar.test.tsx
```

Expected: import or spy failures because the event constant and helper do not exist yet.

- [ ] **Step 3: Implement the client-safe event helper.**

In `src/lib/consent.ts`, add:

```ts
export const SS_CONSENT_CHANGED_EVENT = "ss-consent-changed";

export function notifyConsentChanged(): void {
  window.dispatchEvent(new Event(SS_CONSENT_CHANGED_EVENT));
}
```

Import `notifyConsentChanged` in `ConsentBar.tsx`. Call it after `writeConsent("granted")` and `grantConsent()` in `handleAccept`, and after `writeConsent("denied")` in `handleDecline`, before the local `setDecided(true)` call. Do not change the cookie values, `grantConsent()` call, hydration gate, or consent-bar markup.

- [ ] **Step 4: Run the focused tests and confirm they pass.**

Run:

```bash
bun run test -- src/lib/consent.test.ts src/components/ConsentBar.test.tsx
```

Expected: PASS for the new helper test and all existing ConsentBar tests.

- [ ] **Step 5: Commit the consent signal.**

```bash
git add src/lib/consent.ts src/lib/consent.test.ts src/components/ConsentBar.tsx src/components/ConsentBar.test.tsx
git commit -m "feat: notify mobile CTA after consent decision"
```

---

### Task 3: Rebuild `StickyCtaBar` as the three-action mobile component

**Files:**
- Create: `src/components/StickyCtaBar.test.tsx`
- Modify: `src/components/StickyCtaBar.tsx:1-98`

**Interfaces:**
- Consumes `locale: Locale`, `dict: Pick<Dictionary, "cta">`, and `consentKnown: boolean`.
- Consumes `usePathname()` to identify `/${locale}/appointments`.
- Consumes `SS_CONSENT_CHANGED_EVENT` to reveal after Accept/Decline.
- Produces a semantic navigation bar with three links and an `aria-hidden` mobile spacer when visible.

- [ ] **Step 1: Write the failing component tests.**

Create a test with a hoisted mutable pathname, a lightweight `next/link` anchor mock, and a mocked `track` function:

```tsx
import React from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { site } from "@/lib/site";
import { SS_CONSENT_CHANGED_EVENT } from "@/lib/consent";
import { StickyCtaBar } from "./StickyCtaBar";

const pathname = vi.hoisted(() => ({ value: "/en/about" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

afterEach(() => {
  pathname.value = "/en/about";
  vi.clearAllMocks();
});
```

Use this minimal dictionary:

```tsx
const dict = {
  cta: {
    book: "Book now",
    callNow: "Call now",
    directions: "Directions",
  },
} as Parameters<typeof StickyCtaBar>[0]["dict"];
```

Add tests for these exact behaviors:

```tsx
it("renders nothing before consent is known", () => {
  const { container } = render(
    <StickyCtaBar locale="en" dict={dict} consentKnown={false} />,
  );
  expect(container.firstChild).toBeNull();
});

it("renders Call, Book, and Directions with their intended destinations", () => {
  render(<StickyCtaBar locale="en" dict={dict} consentKnown />);

  expect(screen.getByRole("navigation", { name: "Quick contact" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Call now" })).toHaveAttribute("href", site.contact.phoneHref);
  expect(screen.getByRole("link", { name: "Book now" })).toHaveAttribute("href", "/en/appointments");
  expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute("href", site.contact.directionsHref);
  expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute("rel", "noopener noreferrer");
});

it("hides the bar and spacer on the localized booking path", () => {
  pathname.value = "/en/appointments/";
  const { container } = render(
    <StickyCtaBar locale="en" dict={dict} consentKnown />,
  );
  expect(container.firstChild).toBeNull();
  pathname.value = "/en/about";
});

it("reveals immediately after the consent event", async () => {
  render(<StickyCtaBar locale="en" dict={dict} consentKnown={false} />);
  expect(screen.queryByRole("navigation", { name: "Quick contact" })).toBeNull();

  act(() => window.dispatchEvent(new Event(SS_CONSENT_CHANGED_EVENT)));

  expect(await screen.findByRole("navigation", { name: "Quick contact" })).toBeTruthy();
});
```

Also assert that clicking the three links calls `track("phone_click")`, `track("book_cta_click")`, and `track("directions_click")`, and that the rendered icon SVG elements have `aria-hidden="true"`. Add an RTL test asserting the action-row class contains `flex-row-reverse` for `locale="ar"` and the Book link remains present between the other two actions in the DOM.

- [ ] **Step 2: Run the component test and confirm it fails.**

Run:

```bash
bun run test -- src/components/StickyCtaBar.test.tsx
```

Expected: failures because the current component has only two Button links, no Directions link, no pathname guard, and no consent-event listener.

- [ ] **Step 3: Implement the minimal accessible bar.**

Replace the current span/Button wrappers in `StickyCtaBar.tsx` with direct native links and a small local action-link helper. Keep the existing prop signature and import `Link` from `next/link`, `usePathname` from `next/navigation`, `useEffect`/`useState` from React, `track`, `site`, `dirFor`, and the consent event constant.

Use this state and route guard shape:

```tsx
const pathname = usePathname();
const [consentReady, setConsentReady] = useState(consentKnown);

useEffect(() => {
  const handleConsentChanged = () => setConsentReady(true);
  window.addEventListener(SS_CONSENT_CHANGED_EVENT, handleConsentChanged);
  return () => window.removeEventListener(SS_CONSENT_CHANGED_EVENT, handleConsentChanged);
}, []);

const bookingPath = `/${locale}${site.booking}`;
const normalizedPathname = pathname?.replace(/\/+$/, "") ?? "";

if (!consentReady || normalizedPathname === bookingPath) return null;
```

The action helper must accept `href`, `label`, `icon`, `onClick`, `external`, and optional `className` props, and it must:

- Render an internal `Link` for Book Now and native `<a>` elements for Call Now and Directions.
- Accept `href`, `label`, `icon`, `onClick`, and an `external` flag.
- Put the visible label under the icon, set `aria-label={label}`, and mark the SVG `aria-hidden`.
- Apply `min-h-11`, visible `focus-visible:outline` classes, and `flex-1` sizing.
- Apply the raised circular accent classes only to Book Now.
- Add `target="_blank"` and `rel="noopener noreferrer"` only to Directions.
- Call `track()` from the action's `onClick`; never call `preventDefault()`.

Define these local types and icon components in `StickyCtaBar.tsx` so the helper interface is explicit and the bar has no icon-package dependency:

```tsx
type ActionLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
  external?: boolean;
  className?: string;
};
```

Use these icon bodies:

```tsx
function PhoneIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden fill="none"><path d="M7.5 4.5h3l1.5 4-2 1.5a14 14 0 0 0 4 4l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C11.1 18.5 5.5 12.9 5.5 6.5c0-1.1.9-2 2-2Z" /></svg>;
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden fill="none"><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 10h16M8 14h.01M12 14h.01M16 14h.01" /></svg>;
}

function MapPinIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden fill="none"><path d="M12 20s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" /><circle cx="12" cy="10" r="2" /></svg>;
}

function ActionLink({ href, label, icon, onClick, external = false, className = "" }: ActionLinkProps) {
  const classes = `group flex min-h-11 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tan ${className}`;
  const content = <><span aria-hidden>{icon}</span><span>{label}</span></>;

  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} aria-label={label} className={classes}>{content}</a>;
  }

  return <Link href={href} onClick={onClick} aria-label={label} className={classes}>{content}</Link>;
}
```

Render the row in DOM order Call, Book, Directions. Apply `flex-row-reverse` for Arabic so the visual reading order is correct while Book remains centered. Wrap the row in:

```tsx
<nav aria-label="Quick contact" className="fixed inset-x-0 bottom-0 z-40 bg-espresso px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 text-cream md:hidden">
  <div className={`mx-auto flex max-w-7xl items-end justify-center ${isRtl ? "flex-row-reverse" : ""}`}>
    <ActionLink
      href={site.contact.phoneHref}
      label={dict.cta.callNow}
      icon={<PhoneIcon />}
      onClick={() => track("phone_click")}
    />
    <ActionLink
      href={localizedHref(site.booking)}
      label={dict.cta.book}
      icon={<CalendarIcon />}
      onClick={() => track("book_cta_click")}
      className="-mt-8 min-h-[76px] rounded-full bg-tan px-3 pb-2 pt-3"
    />
    <ActionLink
      href={site.contact.directionsHref}
      label={dict.cta.directions}
      icon={<MapPinIcon />}
      onClick={() => track("directions_click")}
      external
    />
  </div>
</nav>
```

Return a sibling spacer after the `nav`:

```tsx
<div aria-hidden="true" className="h-[calc(88px+env(safe-area-inset-bottom))] md:hidden" />
```

Tune the bar and spacer classes together so the raised Book action and the full label row remain above the final content. Do not add animation or modify global CSS.

- [ ] **Step 4: Run the component tests and confirm they pass.**

Run:

```bash
bun run test -- src/components/StickyCtaBar.test.tsx src/components/ConsentBar.test.tsx
```

Expected: PASS, including the new three-link, route-guard, consent-event, tracking, RTL, focus-label, and icon assertions.

- [ ] **Step 5: Commit the component.**

```bash
git add src/components/StickyCtaBar.tsx src/components/StickyCtaBar.test.tsx
git commit -m "feat: build accessible three-action mobile bar"
```

---

### Task 4: Move the bar to the localized layout and remove duplicate page padding

**Files:**
- Modify: `src/app/[lang]/layout.tsx:5-16,99-106`
- Modify: `src/app/[lang]/page.tsx:4-8,57-59,137-138`
- Modify: `src/app/[lang]/services/[slug]/page.tsx:1-12,70-72,127-128`
- Modify: `src/components/RelatedServiceLink.tsx:12-18`
- Delete: `src/components/KeyPageChrome.tsx`

**Interfaces:**
- The localized layout becomes the sole production mount of `StickyCtaBar`.
- Home and service detail pages no longer add their own fixed-bar padding or wrapper.
- No standalone operational route receives the component.

- [ ] **Step 1: Record the current duplicate ownership before the migration.**

Run this baseline search before changing the imports:

```bash
rg -n "KeyPageChrome|StickyCtaBar" src/app/'[lang]'/page.tsx src/app/'[lang]'/services/'[slug]'/page.tsx src/components/KeyPageChrome.tsx
```

The baseline must show the two page-level KeyPageChrome mounts and the component-owned StickyCtaBar; the post-change ownership check is performed in Step 4. The functional pathname behavior remains covered by StickyCtaBar.test.tsx and the browser spec.

- [ ] **Step 2: Mount the component once from `[lang]/layout.tsx`.**

Import `StickyCtaBar` next to the existing layout components and render it after `<Footer>` so the component's mobile spacer contributes at the end of the document:

```tsx
<Footer dict={dict} locale={lang} />
<StickyCtaBar locale={lang} dict={dict} consentKnown={consentKnown} />
<PopupHost locale={lang} />
```

Keep `ConsentBar` and `WebVitalsReporter` in their existing positions and pass the same server-derived `consentKnown` value to the new mount.

- [ ] **Step 3: Remove page-level mounts and their duplicate spacing.**

In `src/app/[lang]/page.tsx`:

- Remove the `KeyPageChrome` import.
- Change the root wrapper from `className="pb-[64px] md:pb-0"` to an unpadded wrapper.
- Remove the `KeyPageChrome` JSX and its “Sticky Call/Book bar” comment.

In `src/app/[lang]/services/[slug]/page.tsx`:

- Remove the `KeyPageChrome` import.
- Remove `pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0` from the root wrapper.
- Remove the `KeyPageChrome` JSX and its service-detail-only comment.

Delete `src/components/KeyPageChrome.tsx`. In `RelatedServiceLink.tsx`, change the stale type comment to describe the existing `Pick<Dictionary, "serviceDetails">` dependency without mentioning `KeyPageChrome`.

- [ ] **Step 4: Verify single ownership and type-check the migration.**

Run:

```bash
if rg -n "KeyPageChrome|Keep the high-intent mobile bar|Sticky Call/Book bar" src; then exit 1; fi
rg -n "StickyCtaBar" src/app/'[lang]'/layout.tsx src/components/StickyCtaBar.tsx
bun run test -- src/components/StickyCtaBar.test.tsx src/app/'[lang]'/page.test.tsx src/lib/site.test.ts
```

Expected: no stale `KeyPageChrome` references; exactly the layout and component own `StickyCtaBar`; focused tests pass.

- [ ] **Step 5: Commit the layout migration.**

```bash
git add src/app/'[lang]'/layout.tsx src/app/'[lang]'/page.tsx src/app/'[lang]'/services/'[slug]'/page.tsx src/components/RelatedServiceLink.tsx
git rm src/components/KeyPageChrome.tsx
git commit -m "feat: mount mobile actions across public pages"
```

---

### Task 5: Add browser coverage for route scope, consent, responsive behavior, and clearance

**Files:**
- Create: `e2e/mobile-quick-action-bar.spec.ts`

**Interfaces:**
- Uses the existing Playwright base URL and production-build web server from `playwright.config.ts`.
- Uses the `ss_consent=denied` cookie to make the CTA deterministic without granting analytics.
- Uses the static nav accessible name `Quick contact` from `StickyCtaBar`.

- [ ] **Step 1: Write the browser tests.**

Create a focused Playwright suite with a mobile viewport and a cookie helper:

```ts
import { test, expect } from "@playwright/test";

const locales = ["en", "fr", "es", "ar"] as const;

test.describe("mobile quick-action bar", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: "ss_consent", value: "denied", url: "http://localhost:3100" },
    ]);
  });

  test("shows three actions on a public page", async ({ page }) => {
    await page.goto("/en/about");
    const bar = page.getByRole("navigation", { name: "Quick contact" });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole("link")).toHaveCount(3);
    await expect(bar.getByRole("link", { name: /call now/i })).toHaveAttribute("href", "tel:+14505056450");
    await expect(bar.getByRole("link", { name: /book now/i })).toHaveAttribute("href", "/en/appointments");
    await expect(bar.getByRole("link", { name: /directions/i })).toHaveAttribute("target", "_blank");
  });

  for (const locale of locales) {
    test(`hides the bar on ${locale} booking page`, async ({ page }) => {
      await page.goto(`/${locale}/appointments`);
      await expect(page.getByRole("navigation", { name: "Quick contact" })).toHaveCount(0);
    });
  }

  test("appears immediately after declining consent", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/en/about");
    await expect(page.getByRole("navigation", { name: "Quick contact" })).toHaveCount(0);
    await page.getByRole("region", { name: /cookie consent/i }).getByRole("button", { name: /decline/i }).click();
    await expect(page.getByRole("navigation", { name: "Quick contact" })).toBeVisible();
  });

  test("does not render the mobile bar on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/en/about");
    await expect(page.getByRole("navigation", { name: "Quick contact" })).toHaveCount(0);
  });

  test("leaves the final footer above the fixed bar", async ({ page }) => {
    await page.goto("/en/about");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const relation = await page.evaluate(() => {
      const footer = document.querySelector("footer")?.getBoundingClientRect();
      const bar = document.querySelector('nav[aria-label="Quick contact"]')?.getBoundingClientRect();
      return { footerBottom: footer?.bottom ?? 0, barTop: bar?.top ?? 0 };
    });
    expect(relation.footerBottom).toBeLessThanOrEqual(relation.barTop);
  });
});
```

Add an Arabic assertion that the page has `dir="rtl"` and the bar row contains `flex-row-reverse`. Keep test labels matched by regex so localized Call/Book text can vary while the navigation contract remains covered.

- [ ] **Step 2: Run the focused browser suite and confirm it fails before integration is complete.**

Run:

```bash
bun run test:e2e -- e2e/mobile-quick-action-bar.spec.ts
```

Expected before Tasks 3–4: the current two-action bar, missing Directions action, missing global mount, and missing booking guard cause failures.

- [ ] **Step 3: Run the focused browser suite after Tasks 3–4 and fix only feature-scoped failures.**

Run:

```bash
bun run test:e2e -- e2e/mobile-quick-action-bar.spec.ts
```

Expected: PASS for public-page visibility, all localized booking exclusions, immediate consent reveal, desktop hiding, RTL direction, and footer clearance. If the footer-clearance assertion fails, adjust the bar/spacer height in `StickyCtaBar.tsx` rather than adding page-specific padding.

- [ ] **Step 4: Commit the browser coverage.**

```bash
git add e2e/mobile-quick-action-bar.spec.ts
git commit -m "test: cover mobile quick action bar routes"
```

---

### Task 6: Run the complete verification gate

**Files:**
- Read: `docs/superpowers/specs/2026-08-07-mobile-quick-action-bar-design.md`
- Read: all changed files from Tasks 1–5

**Interfaces:**
- Confirms every acceptance criterion in the approved spec is represented by a passing test or static source check.

- [ ] **Step 1: Run the full unit suite.**

```bash
bun run test
```

Expected: PASS with no regressions in existing site, consent, analytics, route, or component tests.

- [ ] **Step 2: Run lint and production build.**

```bash
bun run lint
bun run build
```

Expected: no ESLint errors and a successful Next production build with all four locale paths generated.

- [ ] **Step 3: Run targeted and existing browser suites.**

```bash
bun run test:e2e -- e2e/mobile-quick-action-bar.spec.ts e2e/navigation.spec.ts
```

Expected: PASS for the new CTA suite and existing localized navigation tests.

- [ ] **Step 4: Run the repository security check required before commit.**

```bash
npm audit --audit-level=high
```

Expected: no high-severity dependency findings introduced by this change. Do not install or upgrade dependencies for this feature.

- [ ] **Step 5: Review the final diff and worktree boundaries.**

```bash
git diff --check HEAD~5..HEAD
git status --short
git diff --stat HEAD~5..HEAD
```

Confirm that `tasks/human-tasks.md` and `.superpowers/` are not staged, no `Button.tsx` or unrelated page content changed, the Directions URL appears only in `src/lib/site.ts` and tests, and all commits are limited to the approved feature.
