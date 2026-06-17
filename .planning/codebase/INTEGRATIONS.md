# External Integrations

**Analysis Date:** 2026-06-17

## APIs & External Services

**SalonX Booking & Management System:**
- Booking Widget - `https://app.onglessanssouci.com/widgets/booking-widget.js`
  - Embedded on public pages, language-aware (`data-lang` attribute)
  - File: `src/components/BookingWidget.tsx`
  
- Check-in Widget - `https://app.onglessanssouci.com/widgets/checkin-widget.js`
  - Embedded on `/checkin` (kiosk page, un-localized)
  - File: `src/components/CheckinWidget.tsx`
  
- Technician Queue Widget - `https://app.onglessanssouci.com/widgets/technician-queue-widget.js`
  - Embedded on `/queue` (kiosk page, dark theme, un-localized)
  - File: `src/components/QueueWidget.tsx`
  
- Client Account Portal Widget - `https://app.onglessanssouci.com/widgets/client-account-widget.js`
  - Embedded on `/clientportal` (un-localized), reads `data-account-store` attribute
  - File: `src/components/ClientPortalWidget.tsx`
  
- Subscribe Widget - `https://app.onglessanssouci.com/widgets/subscribe-widget.js`
  - Embedded on `/subscription` (un-localized), reads `data-subscribe-store` attribute
  - File: `src/components/SubscribeWidget.tsx`

**Google Business Profile (My Business v4 API):**
- OAuth2 refresh-token flow, scope: `https://www.googleapis.com/auth/business.manage`
- Build-time fetch of 5-star reviews (script: `scripts/fetch-google-reviews.mjs`)
- Output: `src/data/google-reviews.json` (committed, contains real reviews + aggregate rating)
- Env vars: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`, `GOOGLE_BUSINESS_ACCOUNT_ID`, `GOOGLE_BUSINESS_LOCATION_ID`
- Status: Not currently configured in production (fallback aggregate data used)

**Resend (Email Delivery):**
- REST API: `https://api.resend.com/emails`
- Used by: Contact form (`src/app/api/contact/route.ts`)
- Env vars: `RESEND_API_KEY` (required), `CONTACT_FROM_EMAIL` (required), `CONTACT_TO_EMAIL` (optional, defaults to `site.contact.email`)
- Status: Optional; form degrades gracefully if not configured (returns 503 + fallback message in production, warning in dev)

## Data Storage

**Databases:**
- Supabase PostgreSQL (self-hosted: `api-supabase-ss-website.onglessanssouci.com`)
  - Client: `@supabase/supabase-js` 2.106.1
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` (public), `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - Tables: `popups` (popup content for dynamic homepage modals, admin-edited)
  - RLS Policies: Public read (anon key), write requires service-role key
  - Status: Optional; site falls back to local `src/data/popups.json` if unconfigured

**File Storage:**
- Supabase Storage (same self-hosted Supabase instance)
  - Bucket: `popup-images` (public read, admin write)
  - Use: Admin uploads popup background images
  - Image URLs: `https://api-supabase-ss-website.onglessanssouci.com/storage/v1/object/public/popup-images/...`
  - Status: Optional; empty fallback handled in UI

**Caching:**
- None explicit — Next.js static generation + ISR where applicable
- Revalidation: Popup feed cache set to 60s (`next: { revalidate: 60 }` in `src/app/api/popups/route.ts`)

## Authentication & Identity

**Admin Portal:**
- Auth Provider: Custom in-app, single-owner model
  - Implementation: `src/lib/session.ts` (iron-session)
  - One password (`ADMIN_PASSWORD`) for all admin users (salon owner)
  - Session cookie: `bn_admin`, HTTP-only, secure (production only), SameSite=Lax
  - Session secret: `ADMIN_SESSION_SECRET` (32+ chars, required)
  - Password verification: Timing-safe SHA-256 comparison (prevents timing attacks)
  - Routes: `/admin/*` pages, `/api/admin/*` API endpoints (gated in `src/proxy.ts`)

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, Rollbar, or similar

**Logs:**
- Console-based (stdio)
  - Errors logged to stderr: Supabase failures, email send failures, popup validation issues
  - Info logged to stdout: Admin actions, build-time operations (Google reviews fetch)
  - No structured logging framework detected

**SEO & Site Verification:**
- Google Search Console verification: `GSC_VERIFICATION` env var (value is verification file path or code)
- Bing Webmaster Tools verification: `BING_VERIFICATION` env var
- Schema.org markup: JSON-LD for LocalBusiness, AggregateRating (reviews), BreadcrumbList (localized pages)

## CI/CD & Deployment

**Hosting:**
- Dokploy (self-hosted Docker orchestration platform)
- Domain: onglessanssouci.com (Canonical redirect from www → bare domain via `src/proxy.ts`)
- Environment: Docker container, Node.js 20 Alpine
- Auto-deployment: On merge to `main` branch

**CI Pipeline:**
- None detected (Dokploy auto-deploys without pre-merge checks)
- Local testing required before push (Playwright E2E tests in `e2e/`)

**Build Artifacts:**
- Docker image built from Dockerfile (multi-stage: deps → build → runner)
- Standalone output: `.next/standalone/server.js` (self-contained, no .next/static needed in node_modules)
- Public assets: `public/` directory (robots.txt, sitemaps, favicon, images)

## Environment Configuration

**Required env vars (must be present at runtime for features to function):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Popup read (optional, site works without)
- `SUPABASE_SERVICE_ROLE_KEY` - Admin popup CRUD (optional, admin disabled if missing)
- `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` - Admin login (optional, admin returns 503 if misconfigured)
- `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` - Contact form email (optional, form returns 503 if missing in production)

**Build-time vars (baked into bundle):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Embedded in client JS

**Development-time vars (build scripts only, not runtime):**
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`, `GOOGLE_BUSINESS_ACCOUNT_ID`, `GOOGLE_BUSINESS_LOCATION_ID` - Used by `scripts/fetch-google-reviews.mjs`

**Secrets location:**
- Development: `.env.local` (read by Node via `--env-file` or bun/npm runtime)
- Production: Dokploy environment variables (injected into container at deploy time)
- Template: `env.example` (reference for required vars)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Resend webhook: Contact form sends to owner email (one-way email delivery, no return webhook)
- Google Business Profile: Reviews fetched at build time only (no runtime webhook polling)

---

*Integration audit: 2026-06-17*
