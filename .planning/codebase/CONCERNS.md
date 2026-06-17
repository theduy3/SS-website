# Codebase Concerns

**Analysis Date:** 2026-06-17

## Tech Debt

**Implicit locale routing coupling (high risk for future routes):**
- Issue: New un-localized routes must be manually added to `STANDALONE_PATHS` in `src/proxy.ts` (lines 13-18) or they will be 404'd by the locale middleware. There is no build-time check for this.
- Files: `src/proxy.ts`, `src/proxy.test.ts`
- Impact: Silent routing failures on production when a new standalone route (e.g., `/invoice`, `/print`) is added without updating `STANDALONE_PATHS`. Build passes, E2E tests may not catch it if tests only check localized routes.
- Fix approach: 
  - Add a `getStandalonePaths()` function in a centralized config file (`src/lib/route-config.ts`)
  - Import into both `src/proxy.ts` and route layout files as a consistency check
  - Add a test that validates every non-`[lang]` directory in `src/app/` is listed in `STANDALONE_PATHS`

**Content-Security-Policy not configured:**
- Issue: `next.config.ts` (line 6-9) explicitly notes CSP is not set because the booking widget (`app.onglessanssouci.com`) injects third-party scripts. Without CSP, XSS via injected widget scripts or popup admin uploads cannot be mitigated.
- Files: `next.config.ts`, `src/lib/popups-store.ts` (uploadPopupImage)
- Impact: Malicious popup images or widget script mutations could inject XSS payloads into all page visitors. No CSP to restrict frame-src, script-src, or connect-src.
- Fix approach:
  - Audit `app.onglessanssouci.com` for subresource integrity (SRI) hashes
  - Define a restrictive CSP with inline nonce for safe inline scripts
  - Allowlist only the booking widget origin, Supabase storage origin, and verified CDNs
  - Test with Lighthouse "Best Practices" audit to verify CSP effectiveness

**Popup image uploads without validation:**
- Issue: `src/lib/popups-store.ts` (line 78-95, `uploadPopupImage`) accepts any `File` object and stores it to Supabase with only MIME type preserved. No file size limit, extension validation, or malware scanning.
- Files: `src/lib/popups-store.ts`, `src/components/admin/PopupForm.tsx`
- Impact: Admin could upload GB-sized files, malicious executables disguised as images, or files that Supabase rejects at runtime (silent error to user).
- Fix approach:
  - Add validation: max 5MB, allowed MIME types (image/jpeg, image/png, image/webp only)
  - Reject .exe, .svg, .js, or any double-extension files
  - Add client-side preview and size check before upload
  - Add server-side re-validation in route handler
  - Return detailed error messages on rejection

## Known Bugs

**Possible edge case in locale matching (low probability):**
- Symptoms: Browser with malformed Accept-Language header (e.g., `en;q=2` with q > 1) may bypass the ranking in `src/lib/i18n.ts` (lines 36-41)
- Files: `src/lib/i18n.ts` (matchLocale function)
- Trigger: Send Accept-Language header with invalid q value; edge case with `q=` parsing
- Workaround: Not production-critical (defaults to `defaultLocale: "fr"`)
- Fix approach: Add `Math.min(q, 1.0)` to clamp q values, add test for malformed headers

**Admin 502 error on empty popups table (historical, may recur):**
- Symptoms: Admin page `/admin` returns 502 when Supabase `popups` table is empty or RLS denies access
- Files: `src/app/admin/page.tsx`, `src/lib/popups-store.ts` (readPopups), `src/lib/admin-http.ts` (storeError)
- Trigger: Initial Supabase deployment or RLS policy misconfiguration
- Workaround: Ensure RLS policy grants SELECT to service-role key
- Fix approach: Add fallback empty array in `readPopups()` instead of returning null; this was addressed in memory but verify it's not regressed

## Security Considerations

**Supabase RLS policy configuration vulnerability:**
- Risk: Anon-key table SELECT requires explicit table GRANT, not just RLS policy. Self-hosted Supabase may not grant by default.
- Files: `src/lib/supabase.ts`, `src/lib/popups-store.ts` (readPopups uses public client)
- Current mitigation: Production deployment has GRANT configured (per memory), but new environments may not
- Recommendations:
  - Document the required SQL GRANT statement in `AGENTS.md` or deployment guide
  - Add a startup health check: call `readPopups()` on app boot, log WARNING if it fails

**Admin password + session key in environment variables:**
- Risk: Both `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are stored as plain env vars. If `.env` leaks, the admin login is compromised.
- Files: `src/lib/session.ts` (lines 13-14)
- Current mitigation: `ADMIN_SESSION_SECRET` requires >= 32 chars (line 30), password stored as hash for comparison (line 37-39, timingSafeEqual)
- Recommendations:
  - At startup, validate both are set; fail loudly if missing (already done, line 29-31)
  - Consider rotating `ADMIN_SESSION_SECRET` every 90 days via CI secret rotation
  - Document that `.env.local` must never be committed (already in `.gitignore`, verify it stays that way)

**Email input validation in contact form:**
- Risk: Contact form accepts email input but does NOT verify ownership (no confirmation link sent). A user could submit someone else's email and cause spam.
- Files: `src/components/ContactForm.tsx`, `src/app/api/contact/route.ts`
- Current mitigation: Email is validated as RFC 5322 format via Zod (line 10 of route.ts), stored in `reply_to` header so responses go to the entered address
- Recommendations:
  - Add reCAPTCHA v3 to contact form to block bot submissions
  - Log submission source (IP, user-agent) for abuse tracking
  - Implement rate limiting: max 5 emails per IP per hour

## Performance Bottlenecks

**SEO metadata file size:**
- Problem: `src/lib/seo.ts` is 297 lines. Schema.org builders are large and inlined on every page render.
- Files: `src/lib/seo.ts`
- Cause: JSON-LD builders for Organization, LocalBusiness, AggregateRating, ImageGallery all in one file; no code splitting
- Improvement path:
  - Split into per-schema files: `seo-organization.ts`, `seo-rating.ts`, etc.
  - Lazy-load only on pages that need each schema (e.g., only reviews page loads AggregateRating builder)
  - Measure impact on bundle size via `next build --analyze`

**Admin popup upload UX lacks feedback:**
- Problem: No progress bar during image upload. User sees a "Saving..." button but doesn't know if upload is stuck or slow.
- Files: `src/components/admin/PopupForm.tsx` (no upload progress tracking)
- Cause: Supabase upload is fire-and-forget without onProgress callback
- Improvement path:
  - Pass `onUploadProgress` callback to Supabase upload to track % completion
  - Display progress bar in modal during upload
  - Add timeout (30s) and user-friendly error if upload stalls

## Fragile Areas

**Widget embed injection via imperatively-created script:**
- Files: `src/components/WidgetEmbed.tsx` (lines 57-80)
- Why fragile: Component creates a `<script>` element and appends it to the DOM. If external widget URL changes or becomes unavailable, the entire page's widget fails silently.
- Safe modification:
  - Add a `<noscript>` fallback message ("This widget requires JavaScript")
  - Increase error timeout from default to 10s (widget takes time to initialize)
  - Add client-side console logging for widget load/error events (for debugging)
  - Test widget injection in both Strict Mode and production builds
- Test coverage: `src/components/WidgetEmbed.test.tsx` exists but only tests one happy path; add tests for:
  - Script onload fires with `window.SalonX` global set
  - Script onerror triggers error state and shows retry button
  - Rapid unmount/remount during initial load does not cause double-injection

**Popup schema validation accepts invalid datetime strings:**
- Files: `src/lib/popup.ts` (lines 16-17, `startsAt` and `endsAt` are `z.string().nullable()`)
- Why fragile: Strings are not validated as ISO 8601. A popup can be stored with `startsAt: "invalid-date"`, then cause runtime errors when comparing with `Date` in filtering logic.
- Safe modification:
  - Change validation to `z.string().datetime().nullable().default(null)` (Zod built-in)
  - Add migration: scan all stored popups, validate and repair any with malformed dates
  - Add test that rejects popup with `startsAt: "2026-13-45"`
- Test coverage: No test for malformed datetime in popups; add one

**i18n fallback chain incomplete:**
- Files: `src/lib/popup.ts` (lines 71-74, fallback order: locale → defaultLocale → en → empty string)
- Why fragile: If a translation is missing at all levels, empty string renders silently. Users see nothing; developers don't know a translation is missing.
- Safe modification:
  - Add optional `strict` mode flag; when true, throw an error on missing translation (useful for CI)
  - Add console warning for missing translations in development
  - Return a visible placeholder string (e.g., `[MISSING: popup.title.es]`) if all fallbacks fail
- Test coverage: Test missing translations are logged/visible; currently only `getLocalizedText` is tested, not missing cases

## Scaling Limits

**Admin popup management UI has no pagination:**
- Current capacity: Supabase query returns ALL popups in one fetch. UI renders all in a dropdown/list.
- Limit: If the salon creates 500+ popups over time, the admin page becomes slow and memory-heavy.
- Scaling path:
  - Add pagination: fetch 20 at a time, lazy-load on scroll
  - Add search/filter by title, date range, or status
  - Add "archive" feature to hide inactive popups from the list

**Supabase storage bucket has no retention policy:**
- Current capacity: Unused/deleted popup images remain in `popup-images` bucket forever.
- Limit: Bucket fills up over time, increasing storage costs.
- Scaling path:
  - Add lifecycle policy: delete files older than 90 days
  - Add a cleanup endpoint that marks unused images for deletion
  - Log deleted images for audit trail

## Dependencies at Risk

**Next.js 16 is a cutting-edge release:**
- Risk: Released recently; may have undiscovered bugs or breaking changes in minor versions
- Impact: Upgrading or downgrading could require significant refactoring due to API changes
- Migration plan:
  - Monitor Next.js releases on GitHub; pin to specific minor version (e.g., `16.2.x` not `^16`)
  - Test major version upgrades in CI before merging
  - Keep `node_modules` lockfile (`bun.lock`) committed to ensure reproducible builds

**Resend email service has no fallback:**
- Risk: If Resend API is down, contact form silently fails or returns 503. No retry logic or queue.
- Impact: Users think their message was sent (form shows "success") but email never arrives
- Migration plan:
  - Add queue: store failed emails to Supabase for retry
  - Implement exponential backoff with max 3 retries
  - Alert admin if retry queue grows beyond 100 items

## Missing Critical Features

**No audit log for admin actions:**
- Problem: When an admin creates/updates a popup, there's no record of WHO changed WHAT and WHEN. If content goes wrong, can't trace it.
- Blocks: Accountability, debugging production incidents
- Solution: Add `created_by`, `updated_by`, `created_at`, `updated_at` to popup schema; log all mutations

**No popup scheduling UI:**
- Problem: Popups can have `startsAt` and `endsAt` dates, but admin form doesn't make it easy to set them. This feature is under-used.
- Blocks: Time-limited campaigns, seasonal promotions
- Solution: Add datetime pickers to PopupForm; test with E2E that scheduled popup appears/disappears at correct time

**No popup preview before publish:**
- Problem: Admin can only see a raw form. Can't preview how popup will render to visitors before going live.
- Blocks: Catching typos, design issues, rendering bugs before deployment
- Solution: Add a "Preview" tab that renders the popup using the same `PopupHost` component as visitors see

## Test Coverage Gaps

**Locale-specific URL validation:**
- What's not tested: Only `/clientportal`, `/checkin`, and `/subscription` are tested for exclusion from locale prefixing. If a NEW standalone route is added and NOT added to `STANDALONE_PATHS`, the test suite won't catch it.
- Files: `src/proxy.test.ts` (31 lines, 4 assertions)
- Risk: 404 in production on un-localized route
- Priority: High
- Fix: Add a parametrized test that iterates over `STANDALONE_PATHS` and verifies each one is NOT locale-prefixed

**Admin authentication:**
- What's not tested: Session creation, password verification, logout flow. Only proxy-level auth is tested.
- Files: `src/lib/session.ts` (no tests), `src/app/api/admin/login/route.ts` (no tests)
- Risk: Login bypass, session fixation, timing-attack on password
- Priority: High
- Fix: Add tests for:
  - Correct password sets `session.authed = true`
  - Wrong password is rejected
  - Invalid session secret causes isAuthConfigured() to return false
  - Logout clears session

**Popup datetime filtering:**
- What's not tested: `pickActiveSorted()` logic that filters popups by `startsAt`/`endsAt` dates
- Files: `src/lib/popup.ts` (lines 47-60, no tests)
- Risk: Popup shows at wrong time, or not at all when it should
- Priority: Medium
- Fix: Add tests for boundary conditions:
  - Popup with `now` exactly at `startsAt` is shown
  - Popup with `now` exactly at `endsAt` is not shown
  - Popup with `endsAt < startsAt` is filtered out

**Email service error handling:**
- What's not tested: Resend API failures, malformed responses, network timeouts
- Files: `src/lib/email.ts` (no tests)
- Risk: Contact form returns success but email is lost
- Priority: Medium
- Fix: Add mock tests for Resend API returning 5xx, 4xx, and timeout scenarios

**Widget embed error recovery:**
- What's not tested: Widget script fails to load; retry button logic; error boundary
- Files: `src/components/WidgetEmbed.test.tsx` (111 lines, but only covers happy path)
- Risk: User sees blank screen with no feedback when widget is unavailable
- Priority: Medium
- Fix: Add tests for:
  - Script onerror fires and sets status to "error"
  - Retry button increments `attempt` counter
  - Component clears prior DOM before retrying

**Supabase RLS policy validation:**
- What's not tested: No end-to-end test that verifies popups can be read/written by the correct roles
- Files: None (no integration test with real Supabase)
- Risk: RLS misconfiguration not caught until production
- Priority: High for production deployments
- Fix: Add an E2E test that creates a popup as admin, then verifies public can read it

---

*Concerns audit: 2026-06-17*
