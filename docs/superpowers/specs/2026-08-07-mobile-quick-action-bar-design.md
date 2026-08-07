# Mobile Quick-Action Bar Design

**Status:** Approved
**Date:** 2026-08-07
**Branch:** `codex/split-statement-hero`

## Objective

Give mobile visitors persistent access to the three highest-intent actions:

1. Call Now
2. Book Now
3. Directions

The actions appear in a fixed bottom bar on every public localized page except
the booking page. Book Now is the visual anchor, while all three actions remain
equally discoverable and keyboard accessible.

## Scope

### In scope

The rendered public HTML pages under `src/app/[lang]/`, including the home,
services, service detail, about, contact, FAQ, gallery, reviews, Laval, guides,
comparisons, terms, and privacy pages.

The bar is excluded from `/{locale}/appointments`, including a trailing-slash
variant. The exclusion keeps the appointment flow focused and avoids presenting
another booking prompt inside the booking experience.

### Out of scope

- Desktop versions of the bar; desktop navigation and existing CTAs remain unchanged.
- The booking page's content or embedded booking widget.
- Operational or staff-facing flows such as admin, client portal, check-in, queue,
  and subscription routes.
- Raw Markdown route handlers such as `/{locale}/appointments.md`; these are
  content endpoints, not rendered public pages.
- A map embed or a new directions service.
- Changes to the meaning of the consent cookie or analytics consent policy.

## Approved visual direction

The mobile bar uses the approved booking-emphasis layout:

- Full-width, fixed bar aligned to the bottom edge of the viewport.
- Existing espresso/dark brand background with cream text.
- Three equal action areas in a horizontal row.
- Phone icon above the Call Now label.
- Calendar icon above the Book Now label.
- Map-pin icon above the Directions label.
- Book Now lifted above the bar as a larger eucalyptus/tan circular accent action.
- Small labels remain visible below each icon; labels come from the active locale's
  dictionary.
- Safe-area bottom padding is included for iPhone-style browser insets.
- The bar is mobile-only (`md:hidden`) and does not animate into view.
- Existing reduced-motion behavior remains sufficient because the bar introduces
  no new motion.

The approved visual is a design reference, not a separate production asset.

## Architecture and placement

### Shared mount

Mount the existing `StickyCtaBar` once from
`src/app/[lang]/layout.tsx`. The localized layout already has the active locale,
dictionary, and server-side consent state needed by the component. Centralizing
the mount guarantees that newly added public localized pages receive the bar
without another page-level integration.

### Booking-page guard

`StickyCtaBar` is a client component and will use the current pathname to suppress
itself on the localized booking route. The guard must recognize the active
locale's `/appointments` path and tolerate a trailing slash. It must not hide
the bar on similarly named routes such as an individual service page.

### Existing page-level mounts

Remove the current page-level CTA mounts from the home and service-detail pages
so the global mount cannot duplicate them. `KeyPageChrome` no longer owns the
CTA. Both current callers pass `showTrustBand={false}`, and there are no
production callers that enable the trust band, so remove those two empty wrapper
calls and delete `KeyPageChrome.tsx`. Keep `TrustBand.tsx` and its existing tests
unchanged.

### Content clearance

Because the action bar is fixed and outside normal document flow, the component
must also contribute a mobile-only bottom spacer when it is visible. The spacer
must account for the bar's visual height and safe-area inset so the final page
content and footer can be scrolled above the bar. The booking page must receive
neither the bar nor the spacer.

## Consent behavior

The existing non-overlap policy remains:

- Before a visitor makes a consent decision, the consent bar is the only fixed
  bottom surface.
- After Accept or Decline, the CTA bar appears immediately without requiring a
  full page reload.
- Accept continues to grant analytics consent; Decline continues to deny it.
- `ConsentBar` dispatches a named client event, `ss-consent-changed`, after it
  writes either consent value. `StickyCtaBar` listens for that event and updates
  its local consent-known state. The event must not alter the cookie value or
  analytics behavior.

The CTA can therefore be visible after Decline, but its analytics calls remain
no-ops because `track()` continues to require the granted consent cookie.

## Action behavior and data flow

### Call Now

- Uses `site.contact.phoneHref`.
- Remains a native telephone link so navigation works even if JavaScript or
  analytics is unavailable.
- Fires the existing `phone_click` event through the consent-gated `track()` helper.

### Book Now

- Uses the existing locale-prefixed booking route derived from `site.booking`.
- Remains an internal link with normal Next.js navigation behavior.
- Fires the existing `book_cta_click` event through `track()`.
- Receives the raised accent treatment from the approved visual direction.

### Directions

- Add a dedicated `site.contact.directionsHref` field containing the existing
  Google Maps URL. The CTA must not depend on the position of a URL inside the
  `socialProfiles` array.
- Opens the URL in a new tab with `rel="noopener noreferrer"`; on supported
  mobile devices, the browser may hand the URL off to a maps app.
- Fires a new `directions_click` event through `track()`.
- Tracking must never block the external navigation.

## Localization and RTL

Add `cta.directions` to all four dictionaries. The production labels are:

| Locale | Label |
| --- | --- |
| English (`en`) | Directions |
| French (`fr`) | Itinéraire |
| Spanish (`es`) | Cómo llegar |
| Arabic (`ar`) | الاتجاهات |

The existing Call Now and Book Now dictionary keys remain the source of truth
for those labels. The bar preserves the current RTL convention: Arabic reverses
the horizontal reading order while Book Now remains visually centered.

## Accessibility

- Use a semantic `<nav>` with an accessible name such as “Quick contact”.
- Render each action as a native link (`<a>` or Next `<Link>`), not a clickable
  non-semantic wrapper.
- Mark SVG icons `aria-hidden`; visible labels provide the accessible names.
- Preserve the visible label in any additional `aria-label` to satisfy Label in
  Name requirements.
- Give every action a minimum 44px touch/focus target and a visible keyboard
  focus outline.
- Keep text readable at small size and allow localized labels to wrap cleanly
  rather than clipping or overflowing.
- Ensure the fixed bar and spacer respect `env(safe-area-inset-bottom)`.

## Analytics

Extend the `GaEvent` union with `directions_click`. Existing event names and
consent guards remain unchanged. No event receives phone numbers, map URLs, user
identity, or other personal data.

## Verification plan

### Component and unit coverage

- `StickyCtaBar` renders nothing when consent is unknown.
- It renders exactly three named actions after consent is known.
- Call uses the telephone href; Book uses the localized appointments href; and
  Directions uses the dedicated Google Maps href with the correct external-link
  attributes.
- The booking pathname hides both the bar and its spacer.
- A consent decision event reveals the bar immediately.
- Analytics calls include the existing Call/Book events and the new Directions
  event while remaining safe when tracking is unavailable or denied.
- Consent behavior tests continue to cover Accept, Decline, cookie writes, and
  analytics grant behavior.

### Browser and integration coverage

- At a mobile viewport, a representative public page shows all three actions.
- The localized booking page does not show the bar in each supported locale.
- A public page's final content remains visible above the fixed bar when scrolled
  to the bottom.
- Arabic preserves RTL order and the centered Book Now treatment.
- Desktop viewports do not show the mobile bar.

### Required checks

Run the repository's normal verification commands after implementation:

```text
npm test
npm run lint
npm run build
npm run test:e2e -- e2e/navigation.spec.ts
```

## Acceptance criteria

The feature is complete when:

1. Every rendered public localized page except `/{locale}/appointments` shows
   the fixed mobile bar after consent is decided.
2. The bar has Call Now, raised Book Now, and Directions actions with an icon
   above small localized text.
3. All three links perform the intended navigation independently of analytics.
4. Directions opens the existing Google Maps destination in a new tab or maps app.
5. The bar appears immediately after Accept or Decline without a reload.
6. The booking page has no bar and no reserved bottom spacer.
7. Page content is not obscured by the fixed bar, including on devices with a
   safe-area inset.
8. Keyboard, screen-reader, RTL, and reduced-motion behavior remain accessible.
9. Existing tests and the required verification commands pass.
