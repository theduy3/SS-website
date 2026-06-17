<!-- refreshed: 2026-06-17 -->
# Architecture

**Analysis Date:** 2026-06-17

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Next.js App Router (Server)                         │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│  │  [lang] Public Pages │  │  /admin Dashboard    │  │  Standalone Routes│
│  │ `src/app/[lang]/*`   │  │ `src/app/admin/*`    │  │ /queue, /checkin │
│  └──────────────────────┘  └──────────────────────┘  │ /subscription     │
│                                                       │ /clientportal    │
│                                                       └──────────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
         │                       │
         ├─────────────────┬─────┴──────────────────┐
         │                 │                        │
         ▼                 ▼                        ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  Middleware     │  │  API Routes      │  │  Components (Client) │
│  (locale,auth)  │  │ /api/popups      │  │  Widgets, Galleries  │
│ `src/proxy.ts`  │  │ /api/admin/*     │  │ `src/components/*`   │
└─────────────────┘  │ /api/contact     │  └──────────────────────┘
                     └──────────────────┘
         │                 │                        │
         └────────────┬────┴────────────┬───────────┘
                      │                 │
                      ▼                 ▼
         ┌──────────────────────────────────────────┐
         │     Shared Libraries                      │
         │  i18n, popup, services, SEO, storage     │
         │  `src/lib/*`                              │
         └──────────────────────────────────────────┘
                      │
                      ▼
         ┌──────────────────────────────────────────┐
         │  External Services                        │
         │  Supabase (popups, auth)                 │
         │  Email provider (contact form)           │
         │  Third-party widgets (booking, queue)    │
         └──────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Middleware/Proxy** | Admin auth, locale routing, standalone path bypass | `src/proxy.ts` |
| **Public Pages** | Locale-aware content, SEO, gallery, services, reviews | `src/app/[lang]/*` |
| **Admin Dashboard** | Popup CRUD, session management, form state | `src/app/admin/page.tsx` |
| **API Endpoints** | Contact form processing, popup feed, admin operations | `src/app/api/*` |
| **PopupHost** | Client-side popup rendering, frequency control, keyboard a11y | `src/components/PopupHost.tsx` |
| **Widgets** | Queue, CheckIn, ClientPortal, Subscribe (iframes from external app) | `src/components/*Widget.tsx` |
| **i18n Layer** | Locale detection, RTL support, fallback matching | `src/lib/i18n.ts` |
| **Popup System** | Zod schemas, draft management, active popup selection | `src/lib/popup*.ts` |
| **Storage** | Supabase read/write, image upload, fallback JSON | `src/lib/popups-store.ts` |
| **SEO** | Schema.org markup, metadata generation, pagination | `src/lib/seo.ts` |

## Pattern Overview

**Overall:** Multi-tier Next.js 16 SSR + SSG with third-party widget embedding, admin panel, and fallback-driven popup system.

**Key Characteristics:**
- Server-side rendering (SSR) for public pages with static generation where possible
- Middleware-driven routing (locale prefixing + admin auth)
- Zod schema validation for all external data (popups, contact form)
- Triple-fallback architecture for popups (Supabase → POPUP_SOURCE_URL → bundled JSON)
- Client-side frequency capping for popup display (localStorage/sessionStorage)
- Embedded third-party widgets via iframe (queue, check-in, client portal, subscribe)
- Session-based admin authentication with iron-session sealed cookies

## Layers

**Middleware / Proxy Layer:**
- Purpose: Guard admin routes, prefix public routes with locale, pass-through standalone routes
- Location: `src/proxy.ts`
- Contains: Request inspection, auth checks, locale matching, redirect logic
- Depends on: `src/lib/i18n`, `src/lib/session`, iron-session
- Used by: Next.js routing system (imported as named export in next.config.ts)

**API Routes:**
- Purpose: Handle form submissions, serve popup feed, admin CRUD operations
- Location: `src/app/api/*`
- Contains: Handler functions with Zod validation, error responses, storage calls
- Depends on: `src/lib/popups-store`, `src/lib/popup`, `src/lib/email`, `src/lib/admin-http`
- Used by: Client-side fetch calls, frontend forms

**Page Routes (Server Components):**
- Purpose: Render locale-aware content, generate metadata, orchestrate page layout
- Location: `src/app/[lang]/*`, `src/app/admin/*`, `src/app/queue/*`, etc.
- Contains: Async functions for data fetching (dictionaries, popups), component composition
- Depends on: Dictionaries, services registry, SEO builders
- Used by: App router

**Client Components:**
- Purpose: Interactive widgets, forms, galleries, popup rendering
- Location: `src/components/*` (marked with "use client")
- Contains: React hooks (useState, useEffect, useRef), event handlers, animations
- Depends on: Framer Motion, Zod for client-side validation
- Used by: Server components, other client components

**Shared Libraries:**
- Purpose: Reusable logic, type definitions, constants
- Location: `src/lib/*`
- Contains: i18n config, popup schema, storage adapters, SEO builders, email handler
- Depends on: External SDKs (Supabase, zod)
- Used by: All other layers

## Data Flow

### Primary Request Path: Public Page Load

1. **Request arrives at middleware** (`src/proxy.ts:37-81`)
   - Inspect host header (www → domain redirect, preserves SEO)
   - Check if path is standalone (skip locale routing for /queue, /checkin, /subscription, /clientportal)
   - Match locale from cookie or Accept-Language header
   - Prepend locale to pathname and redirect if needed

2. **Route handler resolves** (`src/app/[lang]/layout.tsx` or `src/app/[lang]/*/page.tsx`)
   - Server component executes
   - Fetch dictionary for the locale (`src/app/[lang]/dictionaries.ts`)
   - Generate metadata via `pageMetadata()` (`src/lib/seo.ts`)
   - Render layout wrapper (Header, Footer, PopupHost, content)

3. **Component tree renders** (`src/app/[lang]/page.tsx`)
   - Compose page sections (Hero, Services, Gallery, Reviews, Contact Form)
   - Import localized text from dictionary
   - Call `Gallery.tsx`, `Testimonials.tsx`, `ContactForm.tsx`

4. **Client hydration** (in browser)
   - PopupHost mounts → fetch `/api/popups`
   - Display active popup based on frequency rules and localStorage
   - Form submission calls `/api/contact`

### Admin Flow: Popup Edit

1. **User navigates to /admin** → middleware checks session cookie → redirects to login if absent
2. **Admin page mounts** (`src/app/admin/page.tsx`)
   - Fetch `/api/admin/popups` (guarded by `guard()`)
   - Render popup list and form
3. **User submits form** → PUT/POST to `/api/admin/popups/{id}`
4. **API route** (`src/app/api/admin/popups/route.ts`)
   - Re-verify auth via `guard()`
   - Parse/validate with PopupSchema
   - Call `upsertPopup()` → Supabase write via service role
5. **Response sent** → UI updates, list refetched

### Public Popup Display

1. **Client fetches** `/api/popups`
2. **Route handler** (`src/app/api/popups/route.ts`)
   - Try `readPopups()` from Supabase (public client, RLS SELECT only)
   - If Supabase fails/unconfigured, try `POPUP_SOURCE_URL` (external JSON endpoint)
   - If that fails, use bundled `src/data/popups.json`
   - Call `pickActiveSorted()` to filter by start/end dates and priority
   - Return `{ popups: [], popup: null }`
3. **PopupHost** (`src/components/PopupHost.tsx:48-69`)
   - For each popup, check `shouldShow()` (localStorage/sessionStorage frequency check)
   - Display first eligible popup
   - Mark as seen after display

**State Management:**
- **Locale state:** Cookie-based (NEXT_LOCALE) or Accept-Language header fallback
- **Admin session:** Sealed iron-session cookie (SESSION_COOKIE = "bn_admin")
- **Popup frequency:** Client-side localStorage/sessionStorage (popup:id:version key)
- **Form state:** React useState hooks in components (no Redux/context)
- **Popup list (admin):** React useState, refetched on save/delete

## Key Abstractions

**Popup System (types + validation):**
- Purpose: Ensure popup data is always valid, support both rich (image + text) and embed (HTML) types
- Examples: `src/lib/popup.ts`, `src/lib/popup-draft.ts`, `src/lib/popups-store.ts`
- Pattern: Zod discriminated union (type: "rich" | "embed") with locale-aware text fields

**i18n Abstraction:**
- Purpose: Single source of truth for locale list, matching, RTL direction, dictionary loading
- Examples: `src/lib/i18n.ts` (constants), `src/app/[lang]/dictionaries.ts` (async loader)
- Pattern: Export readonly locale array, validation predicate, matcher; lazy-load dictionary per route

**Supabase Dual Client:**
- Purpose: Separate public (anon key, RLS-filtered) from admin (service role, unrestricted)
- Examples: `src/lib/supabase.ts`
- Pattern: Lazy-initialize and cache clients; throw if credentials missing

**Admin HTTP Utilities:**
- Purpose: Standardize error responses, guard auth, parse Zod errors
- Examples: `src/lib/admin-http.ts`
- Pattern: Export `guard()` middleware, `badRequest()` response builder, `storeError()` handler

## Entry Points

**Public Site:**
- Location: `src/app/[lang]/layout.tsx` and `src/app/[lang]/page.tsx`
- Triggers: Browser request to `/` (or any `/en`, `/fr`, `/es`, `/ar` URL)
- Responsibilities: Render localized homepage with header, sections, footer; inject PopupHost

**Admin Dashboard:**
- Location: `src/app/admin/page.tsx`
- Triggers: Browser request to `/admin` (guarded by middleware auth check)
- Responsibilities: List all popups; render CRUD form; handle save/delete/logout

**Standalone Routes (Kiosks/Embedded):**
- Location: `src/app/queue/page.tsx`, `src/app/checkin/page.tsx`, `src/app/clientportal/page.tsx`, `src/app/subscription/page.tsx`
- Triggers: Browser request to `/queue`, `/checkin`, `/clientportal`, `/subscription` (no locale prefix)
- Responsibilities: Render minimal layout; embed third-party widget iframe

**API Endpoints:**
- **Public Popup Feed:** `GET /api/popups` → JSON { popups, popup }
- **Contact Form:** `POST /api/contact` → Sends email, returns status
- **Admin Popups List:** `GET /api/admin/popups` (auth required) → List
- **Admin Popup Upsert:** `POST|PUT /api/admin/popups/{id}` (auth required)
- **Admin Popup Delete:** `DELETE /api/admin/popups/{id}` (auth required)
- **Admin Login:** `POST /api/admin/login` → Set sealed session cookie
- **Admin Logout:** `DELETE /api/admin/login` → Clear cookie

## Architectural Constraints

- **Threading:** Single-threaded event loop (Node.js async/await); no worker threads. Supabase calls and email are I/O-bound and don't block.
- **Global state:** Supabase clients are module-level singletons (lazy-initialized in `src/lib/supabase.ts`). Admin session is per-request via cookie. No Redux/Zustand state management.
- **Circular imports:** None detected. Clear unidirectional dependency tree: proxy → i18n/session; pages → components + lib; components → lib only.
- **Locale routing:** Middleware-driven prefix enforcement. Public pages MUST be under `[lang]` or explicitly added to STANDALONE_PATHS. Build won't catch missing entries; must test manually or add tests.
- **Session storage:** Sealed iron-session cookie (requires ADMIN_SESSION_SECRET ≥ 32 chars). No database session table — stateless.
- **Third-party widgets:** Rendered via iframe. No direct access to parent DOM. Communication via postMessage not implemented; widgets are purely visual.
- **Image optimization:** Next.js Image component with remote hostname pattern for Supabase CDN. Local images in `public/images/`.

## Anti-Patterns

### Hardcoded Locale-Dependent URLs

**What happens:** Page routes hardcode locale in hrefs like `href={/${lang}/services}` even though the locale is already in params.
**Why it's wrong:** Couples pages to the i18n layer; makes refactoring locale structure error-prone; no validation that locale is valid.
**Do this instead:** Use a utility function (or page-level const) to ensure locale is validated before constructing hrefs. Consider a `useLocale()` hook or server-side helper in pages.

### Missing Standalone Path Registrations

**What happens:** New un-localized routes (e.g., `/kiosk`) are created but not added to STANDALONE_PATHS in `src/proxy.ts` line 13-18. Middleware silently redirects them to `/{locale}/kiosk`, returning 404.
**Why it's wrong:** No build-time error; route 404s at runtime only in production.
**Do this instead:** Create a test assertion in `src/proxy.test.ts` for every new standalone route (see lines 22-25 as pattern). Guard route creation with a checklist that includes "Add to STANDALONE_PATHS + test."

### Popup Schema Assumed Valid in Admin

**What happens:** `src/app/admin/page.tsx` imports popup data and calls `toPopup()` / `toDraft()` without re-validating after storage round-trip.
**Why it's wrong:** If Supabase returns corrupt data (schema drift or bug), admin page crashes silently.
**Do this instead:** Re-parse popups after retrieval in `listPopups()` or on the client. Use `PopupSchema.parse()` to throw loudly if data is invalid.

### Email Provider Fallback Silent in Production

**What happens:** Contact form succeeds even if email is not configured (line 34-44 of `src/app/api/contact/route.ts` checks and returns 503 only if not production).
**Why it's wrong:** User thinks message was sent; it was not.
**Do this instead:** Always fail loudly if email is not configured. Remove NODE_ENV check; require email provider for all environments.

## Error Handling

**Strategy:** Try-catch at all async boundaries; fail fast with user-friendly messages on UI-facing routes; log detailed errors server-side.

**Patterns:**
- **Zod validation errors:** Extract first issue message → `safeParse()` result checked; provide 422 status and error text to client
- **Async operations:** Wrap fetch/database calls in try-catch; catch blocks return `StoreResult<T>` union type ({ ok: true, data: T } | { ok: false, reason: string })
- **Network failures:** Popup system has triple fallback (Supabase → external URL → bundled JSON); contact email has fallback response; PopupHost swallows network errors (no popup shown, no error to user)
- **Missing env vars:** Startup check in `src/lib/supabase.ts` throws if URL or keys missing; `hasValidSession()` returns false if ADMIN_SESSION_SECRET invalid
- **Invalid locale:** `isLocale()` predicate used in page routes; invalid locale returns notFound() (404)

## Cross-Cutting Concerns

**Logging:** Console.error for server-side failures (popup parsing, email, Supabase); console.warn for degraded mode (email provider fallback). No structured logging library; suitable for serverless/Docker logs.

**Validation:** All external data validated with Zod (popups, contact form, popup schema on storage read). No validation needed for internal state (Redux-like immutability expected in React).

**Authentication:** Session-based admin auth via iron-session sealed cookie. No JWT. Logout clears cookie. No role-based access control (all authed admins can CRUD all popups).

**Internationalization:** Lazy-loaded per-route dictionaries; fallback to English for missing keys (see `getText()` in `src/lib/popup.ts`). RTL support for Arabic via `dirFor()` and `<html dir={rtl}>`.

---

*Architecture analysis: 2026-06-17*
