# Codebase Structure

**Analysis Date:** 2026-06-17

## Directory Layout

```
SS-website/
├── .next/                      # Next.js build output (generated)
├── .playwright-mcp/            # Playwright config/cache
├── .planning/                  # Documentation and analysis
│   └── codebase/              # Generated codebase maps (ARCHITECTURE.md, etc.)
├── .claude/                    # Claude agent config
├── e2e/                        # Playwright E2E tests (excludes from vitest)
├── public/                     # Static assets (images, fonts)
│   └── images/                # Service photos, hero, team images
├── src/
│   ├── app/                   # Next.js App Router (server + API)
│   │   ├── [lang]/            # Locale-aware public pages (en, fr, es, ar)
│   │   │   ├── layout.tsx     # Root layout (Header, Footer, PopupHost)
│   │   │   ├── page.tsx       # Home page
│   │   │   ├── dictionaries.ts # Async dictionary loader
│   │   │   ├── contact/
│   │   │   ├── services/
│   │   │   ├── reviews/
│   │   │   ├── gallery/
│   │   │   ├── about/
│   │   │   ├── faq/
│   │   │   ├── terms/
│   │   │   ├── privacy/
│   │   │   ├── appointments/
│   │   │   ├── comparisons/    # Dynamic routes for service comparisons
│   │   │   │   └── [slug]/page.tsx
│   │   │   └── ...
│   │   ├── admin/              # Admin dashboard (auth-guarded)
│   │   │   ├── layout.tsx      # Admin layout (no Header/Footer)
│   │   │   ├── page.tsx        # Popup CRUD UI
│   │   │   ├── login/          # Login form
│   │   │   │   └── page.tsx
│   │   │   └── ...
│   │   ├── api/                # API routes (server-only handlers)
│   │   │   ├── contact/
│   │   │   │   └── route.ts    # POST contact form
│   │   │   ├── popups/
│   │   │   │   └── route.ts    # GET public popup feed
│   │   │   ├── admin/          # Auth-guarded admin API
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts # POST/DELETE login
│   │   │   │   ├── popups/
│   │   │   │   │   ├── route.ts # GET (list) / POST (create)
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts # PUT (update) / DELETE
│   │   │   │   └── upload/
│   │   │   │       └── route.ts # POST image upload
│   │   │   └── ...
│   │   ├── queue/              # Standalone kiosk page (no locale prefix)
│   │   │   ├── layout.tsx      # Minimal layout (no Header/Footer)
│   │   │   └── page.tsx        # Embed QueueWidget iframe
│   │   ├── checkin/            # Standalone check-in kiosk
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx        # Embed CheckinWidget iframe
│   │   ├── clientportal/       # Standalone client account portal
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx        # Embed ClientPortalWidget iframe
│   │   ├── subscription/       # Standalone subscription page
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx        # Embed SubscribeWidget iframe
│   │   ├── globals.css         # Tailwind CSS globals, color vars
│   │   ├── robots.ts           # SEO robots.txt generation
│   │   ├── sitemap.ts          # SEO sitemap generation
│   │   └── manifest.ts         # PWA manifest
│   ├── components/             # React UI components (server + client)
│   │   ├── Header.tsx          # Top navigation (server)
│   │   ├── Footer.tsx          # Bottom footer (server)
│   │   ├── PopupHost.tsx       # Popup modal renderer (client)
│   │   ├── PopupRich.tsx       # Rich popup card (client)
│   │   ├── PopupEmbed.tsx      # HTML embed popup (client)
│   │   ├── ContactForm.tsx     # Contact form with validation (client)
│   │   ├── Button.tsx          # Reusable button (server)
│   │   ├── Gallery.tsx         # Service photo carousel (client, Framer Motion)
│   │   ├── Testimonials.tsx    # Customer testimonials (server)
│   │   ├── ServicePhoto.tsx    # Individual service photo (server)
│   │   ├── ReviewCard.tsx      # Google review card (server)
│   │   ├── Accordion.tsx       # FAQ accordion (client)
│   │   ├── Reveal.tsx          # Scroll-reveal animation (client, Framer Motion)
│   │   ├── ComparisonTable.tsx # Service comparison table (server)
│   │   ├── LegalDocument.tsx   # Legal page wrapper (server)
│   │   ├── JsonLd.tsx          # JSON-LD schema injection (server)
│   │   ├── Stars.tsx           # Star rating display (server)
│   │   ├── admin/              # Admin-only components
│   │   │   ├── PopupForm.tsx   # Popup editor form
│   │   │   └── ...
│   │   ├── *Widget.tsx         # Third-party widget embeds
│   │   │   ├── QueueWidget.tsx
│   │   │   ├── CheckinWidget.tsx
│   │   │   ├── ClientPortalWidget.tsx
│   │   │   └── SubscribeWidget.tsx
│   │   └── *.test.tsx          # Component unit tests (vitest)
│   ├── lib/                    # Shared utilities & types
│   │   ├── i18n.ts            # Locale config, matching, RTL direction
│   │   ├── popup.ts           # Popup Zod schemas, type defs, helpers
│   │   ├── popup-draft.ts     # Draft-to-popup conversion, form state
│   │   ├── popups-store.ts    # Supabase read/write, image upload, fallback
│   │   ├── supabase.ts        # Lazy-init public + admin clients
│   │   ├── admin-http.ts      # Admin API utils (guard, badRequest, storeError)
│   │   ├── session.ts         # Session type defs & helpers
│   │   ├── seo.ts             # SEO builders (metadata, schema, pagination)
│   │   ├── services.ts        # Service registry (id, title, slug, photo)
│   │   ├── site.ts            # Site constants (name, contact, booking URL, etc.)
│   │   ├── email.ts           # Email handler (SendGrid or fallback)
│   │   ├── comparisons.ts     # Service comparison logic
│   │   ├── reviews.ts         # Google reviews fetcher
│   │   ├── gallery.ts         # Gallery slide builder
│   │   ├── format.ts          # Locale-aware formatting utilities
│   │   └── dictionary.ts      # Dictionary type defs
│   ├── dictionaries/          # Localized content (JSON or TS)
│   │   ├── en.json           # English strings
│   │   ├── fr.json           # French strings
│   │   ├── es.json           # Spanish strings
│   │   └── ar.json           # Arabic strings
│   ├── data/                  # Static data
│   │   ├── popups.json        # Bundled popup fallback
│   │   ├── testimonials.ts    # Hardcoded testimonials
│   │   └── google-reviews.json # Cached Google reviews
│   └── proxy.ts               # Middleware for locale routing & admin auth
├── .env.local                 # Environment variables (not committed)
├── .env.example               # Example env template
├── .gitignore                 # Exclude .env, node_modules, .next, etc.
├── eslint.config.mjs          # ESLint configuration
├── tsconfig.json              # TypeScript config (@/* path alias)
├── next.config.ts             # Next.js config (securityHeaders, images)
├── vitest.config.ts           # Vitest unit test config
├── vitest.setup.ts            # Vitest setup (globals, jsdom)
├── playwright.config.ts       # Playwright E2E config
├── package.json               # Dependencies (Next.js 16, React 19, zod, Supabase)
├── bun.lock                   # Bun lockfile (preferred over npm)
├── Dockerfile                 # Container build (Node 20+)
├── env.example                # Documentation of required env vars
├── AGENTS.md                  # Project-specific agent notes
└── CLAUDE.md                  # Project config (references AGENTS.md)
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router routes (server + API)
- Contains: Page components, layouts, API handlers
- Key files: `[lang]/layout.tsx` (root), `api/**/route.ts` (endpoints)

**`src/app/[lang]/`:**
- Purpose: Locale-aware public pages (dynamically routed by i18n)
- Contains: Page.tsx for each route (home, services, contact, etc.)
- Key files: `page.tsx` (home), `dictionaries.ts` (async loader)

**`src/app/admin/`:**
- Purpose: Admin dashboard (auth-guarded by middleware)
- Contains: Popup CRUD UI, login page, admin-only components
- Key files: `page.tsx` (dashboard), `login/page.tsx` (login form)

**`src/app/api/`:**
- Purpose: Server-only request handlers (contact, popups, admin operations)
- Contains: `route.ts` files exporting GET/POST/PUT/DELETE handlers
- Key files: `popups/route.ts` (public feed), `admin/popups/route.ts` (CRUD, guarded)

**`src/app/queue/`, `/checkin/`, `/clientportal/`, `/subscription/`:**
- Purpose: Standalone kiosk/embedded pages (bypass locale routing via STANDALONE_PATHS)
- Contains: Minimal layouts + widget iframes
- Key files: `layout.tsx` (no Header/Footer), `page.tsx` (empty, renders widget)

**`src/components/`:**
- Purpose: Reusable React components (server + client)
- Contains: UI components, widgets, forms, animations
- Key files: `PopupHost.tsx` (popup system), `ContactForm.tsx` (form validation), `Gallery.tsx` (carousel)

**`src/lib/`:**
- Purpose: Shared utilities, types, schemas, external SDK wrappers
- Contains: i18n, popup logic, Supabase client, SEO builders
- Key files: `popup.ts` (schemas), `popups-store.ts` (storage adapter), `i18n.ts` (locale config)

**`src/dictionaries/`:**
- Purpose: Localized strings for all supported locales
- Contains: JSON or TS modules (one per language)
- Key files: `en.json`, `fr.json`, `es.json`, `ar.json`

**`src/data/`:**
- Purpose: Static bundled data (not localized, used as fallback)
- Contains: Popup fallback, testimonials, cached reviews
- Key files: `popups.json` (fallback if Supabase + POPUP_SOURCE_URL both fail)

**`public/images/`:**
- Purpose: Static image assets (optimized for Next.js Image component)
- Contains: Service photos, hero image, team photo
- Key files: `hero.jpg`, `team.jpg`, `services/*.jpg`

**`e2e/`:**
- Purpose: Playwright end-to-end tests (separate from unit tests)
- Contains: `.spec.ts` files for critical user flows
- Key files: Excluded from vitest (has own config)

**`.planning/codebase/`:**
- Purpose: Generated codebase documentation (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Contains: Maps written by `/gsd-map-codebase` agent
- Key files: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

## Key File Locations

**Entry Points:**
- `src/app/[lang]/layout.tsx`: Root layout (Server), renders Header, Footer, PopupHost wrapper
- `src/app/[lang]/page.tsx`: Home page (Server), orchestrates sections
- `src/app/admin/page.tsx`: Admin dashboard (Client, "use client"), popup CRUD UI
- `src/proxy.ts`: Middleware for all requests, handles locale routing + admin auth

**Configuration:**
- `tsconfig.json`: TypeScript strict mode, path alias `@/*` → `src/*`
- `next.config.ts`: Security headers, remote image patterns, standalone build
- `vitest.config.ts`: Unit test runner config (jsdom environment)
- `playwright.config.ts`: E2E test runner config

**Core Logic:**
- `src/lib/popup.ts`: Zod schemas for popup types (Rich, Embed), type definitions
- `src/lib/popups-store.ts`: Supabase read/write, image upload, fallback JSON loading
- `src/lib/i18n.ts`: Locale list, matching algorithm, RTL direction, fallback
- `src/lib/seo.ts`: Schema.org builders, metadata generators, pagination helpers
- `src/app/api/popups/route.ts`: Public popup feed with triple fallback
- `src/app/api/contact/route.ts`: Contact form processing + email sending

**Testing:**
- `src/proxy.test.ts`: Middleware behavior (locale routing, standalone paths)
- `src/components/*.test.tsx`: Component unit tests (vitest + React Testing Library)
- `e2e/`: Playwright end-to-end tests (critical user flows)

## Naming Conventions

**Files:**
- **Routes:** `page.tsx`, `layout.tsx`, `route.ts` (Next.js standard)
- **Components:** PascalCase, single file = single component (e.g., `Gallery.tsx`)
- **Libraries:** camelCase descriptive names (e.g., `popups-store.ts`, `admin-http.ts`)
- **Tests:** `.test.ts` or `.test.tsx` suffix (co-located with source)
- **Data/Config:** lowercase, kebab-case (e.g., `google-reviews.json`)

**Directories:**
- **Features:** Named after feature (e.g., `admin/`, `queue/`)
- **Locale routes:** `[lang]/` (Next.js dynamic segment)
- **Dynamic segments:** `[id]/` for route parameters
- **Type:** `components/`, `lib/`, `data/`, `dictionaries/` (plural where applicable)

## Where to Add New Code

**New Public Page (e.g., /booking-guide):**
1. Create `src/app/[lang]/booking-guide/page.tsx` (server component)
2. Add route handler: `export async function generateMetadata({ params }: LangParams) { ... }`
3. Import dictionary: `const dict = await getDictionary(lang);`
4. Add strings to all locale files: `src/dictionaries/{en,fr,es,ar}.json`
5. Add test: `src/app/[lang]/booking-guide/page.test.ts` (optional for simple pages)

**New API Endpoint (e.g., POST /api/feedback):**
1. Create `src/app/api/feedback/route.ts`
2. Define Zod schema: `const FeedbackSchema = z.object({ ... })`
3. Implement handler: `export async function POST(request: Request) { ... }`
4. Return standardized response: `NextResponse.json({ success: boolean, data?: T, error?: string })`
5. Add tests: `src/app/api/feedback/route.test.ts`

**New Component:**
1. Create `src/components/MyComponent.tsx` (server by default)
2. Add "use client" if it uses hooks/event handlers
3. Import from `src/lib/` for shared logic (no circular imports)
4. Add tests co-located: `src/components/MyComponent.test.tsx`
5. Export from component (no barrel file index.ts)

**New Standalone Page (e.g., /staff-dashboard):**
1. Create `src/app/staff-dashboard/layout.tsx` (minimal, no Header/Footer)
2. Create `src/app/staff-dashboard/page.tsx` (embeds widget or minimal UI)
3. **CRITICAL:** Add "/staff-dashboard" to STANDALONE_PATHS in `src/proxy.ts` line 13-18
4. Add test: `src/proxy.test.ts` line 27-31 pattern (verify no locale redirect)
5. Build and test manually (build won't catch missing STANDALONE_PATHS entry)

**New Admin Feature:**
1. Add Zod schema in `src/lib/popup.ts` or new file `src/lib/your-feature.ts`
2. Create API route: `src/app/api/admin/your-feature/route.ts`
3. Add guard: `const denied = await guard(); if (denied) return denied;`
4. Create form component: `src/components/admin/YourFeatureForm.tsx`
5. Update admin page: `src/app/admin/page.tsx` to call your form

**New Utility/Library:**
- Small (<200 lines): Add to existing `src/lib/*.ts` (e.g., format utilities)
- Medium (200–400 lines): Create `src/lib/my-feature.ts`
- Large (>400 lines): Create `src/lib/my-feature/` directory with index.ts + helpers
- Always export from top-level file for simple imports

**New i18n String:**
1. Add to all four locale files: `src/dictionaries/{en,fr,es,ar}.json`
2. Use consistent key path (e.g., `home.newString`)
3. Update TypeScript dictionary type in `src/lib/dictionary.ts` if structure changes
4. Test in at least one locale via browser

## Special Directories

**`src/app/[lang]/dictionaries.ts`:**
- Purpose: Async dictionary loader (called once per route render)
- Generated: No (hand-written)
- Committed: Yes
- Pattern: `export async function getDictionary(locale: Locale): Promise<Dictionary> { ... }`

**`src/dictionaries/`:**
- Purpose: Locale-specific strings
- Generated: No (hand-edited, may be auto-generated from external service in future)
- Committed: Yes
- Pattern: One JSON or TS file per locale

**`src/app/globals.css`:**
- Purpose: Tailwind CSS globals, CSS custom properties (color vars: --cream, --mocha, etc.)
- Generated: No
- Committed: Yes
- Pattern: Define custom properties at `:root`, Tailwind classes below

**`src/data/popups.json`:**
- Purpose: Bundled popup fallback (used when Supabase + POPUP_SOURCE_URL both unavailable)
- Generated: No (hand-edited or exported from admin)
- Committed: Yes
- Pattern: Array of Popup objects (must match PopupSchema)

**`public/images/`:**
- Purpose: Static images served directly (not optimized by Next.js build)
- Generated: No
- Committed: Yes (jpg/png)
- Pattern: Organized by type (services/, team.jpg, hero.jpg)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**`.planning/codebase/`:**
- Purpose: Codebase documentation (generated by `/gsd-map-codebase` agent)
- Generated: Yes (by agent)
- Committed: Yes (Git committed for version control)
- Pattern: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

---

*Structure analysis: 2026-06-17*
