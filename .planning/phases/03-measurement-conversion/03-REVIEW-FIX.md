---
phase: 03-measurement-conversion
fixed_at: 2026-06-18T18:37:00-07:00
review_path: .planning/phases/03-measurement-conversion/03-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-06-18T18:37:00-07:00
**Source review:** `.planning/phases/03-measurement-conversion/03-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

---

## Fixed Issues

### WR-01 + IN-02: Validate consent cookie value and add server-only sentinel

**Files modified:** `src/lib/consent.server.ts`
**Commit:** `af4db93`
**Applied fix:** Replaced the bare `as "granted" | "denied" | undefined` cast with
a runtime equality check (`if (value === "granted" || value === "denied") return value; return undefined`).
Any cookie value that is not exactly one of the two valid strings (including attacker-controlled
values) now returns `undefined`, preventing a garbage cookie from making `consentKnown` true.
Added `import "server-only"` as the first import so bundling this module into a client chunk
becomes a build-time error rather than a runtime crash.

---

### IN-03 + CR-02: Tighten GA id regex and suppress pre-consent page_view

**Files modified:** `src/components/Analytics.tsx`
**Commit:** `613057c`
**Applied fix (IN-03):** Changed `GA_ID_PATTERN` from `/^G-[A-Z0-9-]+$/` to
`/^G-[A-Z0-9][A-Z0-9-]*$/`. The first character after `G-` must now be alphanumeric,
rejecting ids like `G---------`.

**Applied fix (CR-02, Analytics.tsx part):** Added `send_page_view:false` to the
`gtag('config', gaId, {...})` call so no automatic page_view hit is queued before the
user grants consent. Added `wait_for_update:500` to the consent default stub so GA4
holds the buffered hit for 500 ms instead of discarding it at its own default timeout.

---

### CR-01 + CR-02: Consent guard in track() and manual page_view in grantConsent()

**Files modified:** `src/lib/analytics.ts`, `src/lib/analytics.test.ts`
**Commit:** `eaf700b`
**Applied fix (CR-01):** Imported `SS_CONSENT_COOKIE` from `./consent` and added a
`hasConsentGranted()` helper that reads `document.cookie` client-side. `track()` now
returns early unless the `ss_consent` cookie is exactly `"granted"`. Declined-consent
users can no longer generate outbound `gtag("event",...)` HTTP requests (Law 25 / GDPR).
The existing `window`/`gtag` guards are preserved.

**Applied fix (CR-02, analytics.ts part):** After calling `gtag("consent","update",
{analytics_storage:"granted"})`, `grantConsent()` now fires one manual
`gtag("event","page_view")` to capture the visit that was suppressed at config time
by `send_page_view:false`. No double page_view is possible because the config call
no longer sends one automatically.

**Tests updated:** The existing two `track()` tests that expected gtag to fire without
a consent cookie now set `ss_consent=granted` before calling `track()`. Four new tests
cover the denied/absent/garbage-value guard paths. Two new tests cover the `page_view`
emitted by `grantConsent()` and the round-trip (cookie set → grantConsent() → track()
succeeds). Test count: 115 → 120, all pass.

---

### WR-02: Add onKeyDown to span wrappers in StickyCtaBar

**Files modified:** `src/components/StickyCtaBar.tsx`
**Commit:** `aa68d67`
**Applied fix:** Added `onKeyDown` handlers to both `<span>` wrappers that call
`track("phone_click")` / `track("book_cta_click")` when `e.key === "Enter"` or
`e.key === " "`. Keyboard users activating the inner `Button` now trigger the
conversion event on the same key presses that activate the link. Navigation
(`tel:` / `<Link>`) lives on the inner `Button` which is the real focusable element
and is unaffected — `track()` throwing cannot block navigation. `Button.tsx` is
unchanged (onClick ban, D-06, UI-SPEC line 174).

---

## Skipped Issues

None.

---

## Verification

- `bunx tsc --noEmit`: clean (0 errors) with all five changed files applied simultaneously
- `bun run test --run`: 120/120 tests pass (was 115; 5 new consent-gated tests added)
- Both checks run against the combined diff before the worktree was merged

---

_Fixed: 2026-06-18T18:37:00-07:00_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
