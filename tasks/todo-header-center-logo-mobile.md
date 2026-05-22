<!-- s1 metadata
task-name: header-center-logo-mobile
scope: small
status: committed
repo: /Users/theduy/Repo/SS-website
created-at: 2026-05-21
-->

## Goal

Mobile-only header layout change: `[ EN▾ ]  [ LOGO ]  [ ☰ ]` — language selector left, logo centered, hamburger right. Desktop layout unchanged.

## Decisions (from user)

- Desktop: **no changes** (logo left, nav center, locale+IG+Book right).
- Mobile top bar: locale left, logo center, hamburger right.
- LocaleSwitch **removed** from inside the open hamburger menu (no duplication; it now lives in the top bar).

## Approach

Single file: `src/components/Header.tsx`. All changes scoped to mobile (`md:hidden` / reset at `md:`) so desktop flex (`justify-between`) is untouched.

1. Add `relative` to the top-bar container (`<div class="...flex...justify-between...">`) — anchor for absolute-centered logo.
2. Insert a **mobile-only** `<LocaleSwitch>` as the first flow child, `md:hidden`. On mobile this sits at the left (justify-between).
3. Logo `<Link>`: absolute-center on mobile, static on desktop.
   - Mobile: `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` (out of flow → perfectly centered).
   - Desktop reset: `md:static md:translate-x-0 md:translate-y-0` (returns to first flow child → left).
4. Remove the `<LocaleSwitch>` block from inside the hamburger dropdown (current lines ~129–131).

### Resulting flow

- **Desktop (md+):** mobile-locale hidden, logo static-first, nav, actions → `justify-between` → logo left / nav center / actions right. **Unchanged.**
- **Mobile:** flow children = locale + hamburger → `justify-between` → locale left / hamburger right. Logo absolute-centered between them.

## Steps

- [x] Edit `Header.tsx`: add `relative` to top-bar container
- [x] Edit `Header.tsx`: add mobile-only `LocaleSwitch` (left, `md:hidden`)
- [x] Edit `Header.tsx`: make logo absolute-centered on mobile, static on desktop
- [x] Edit `Header.tsx`: remove `LocaleSwitch` from hamburger dropdown
- [x] Verify: `bun run build` clean
- [x] Verify: Playwright E2E — 51/52 pass; the 1 failure (`homepage.spec.ts` testimonials) is from a **pre-existing uncommitted marquee change in `Testimonials.tsx`**, unrelated to this header work
- [x] Verify: mobile screenshot = `[EN▾] [logo center] [☰]`; desktop screenshot unchanged

## Risk

Low. Layout-only, mobile-scoped via Tailwind responsive prefixes. Desktop classes untouched. LocaleSwitch dropdown opens `end-0` (right-aligned) → safe at top-left, no left-edge overflow.
