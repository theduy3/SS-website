# Technology Stack

**Analysis Date:** 2026-06-17

## Languages

**Primary:**
- TypeScript 5.x - All source code, strict mode enabled
- JSX/TSX - React components, server and client

**Secondary:**
- JavaScript - Build scripts (`scripts/fetch-google-reviews.mjs`), configuration
- CSS/Tailwind - Styling via `@tailwindcss/postcss`

## Runtime

**Environment:**
- Node.js 20.x (Alpine) - Development and production
- Bun 1.x - Package manager and build tooling

**Package Manager:**
- Bun (`bun.lock`) - Frozen lockfile enforced in Docker
- npm scripts run through Node in production Docker image

## Frameworks

**Core:**
- Next.js 16.2.6 - Full-stack React framework
  - App Router (React 19 Server Components)
  - Middleware/Proxy for auth and locale routing
  - Standalone output for Docker deployment
  - Image optimization with `remotePatterns` for Supabase Storage and SalonX app

**UI/Animation:**
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering
- Framer Motion 12.39.0 - Animation primitives (AnimatePresence, motion components)

**Testing:**
- Vitest - Unit test runner (configured via `vitest.setup.ts`)
- Playwright 1.60.0 - E2E testing (tests in `e2e/` directory)
- Testing Library (DOM, Jest-DOM) 10.4.1, 6.9.1 - Component testing utilities

**Build/Dev:**
- Turbopack (Next.js 16 bundler, pinned to project root via `turbopack.root`)
- TypeScript Compiler - Type checking, no emit
- ESLint with Next.js config - Linting

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.106.1 - Supabase client for database and file storage
  - Dual-client architecture: public (anon key) + admin (service-role key, server-only)
  - Used for popup CRUD, image uploads, read operations with RLS

**Authentication & Sessions:**
- iron-session 8.0.4 - HTTP-only cookie session sealing (admin portal only)
  - Requires 32+ char `ADMIN_SESSION_SECRET`
  - Single-owner password auth via `ADMIN_PASSWORD`

**Validation:**
- Zod 4.4.3 - Schema validation for forms, API requests, popup data

**Infrastructure:**
- next/server - Request/Response handling, middleware
- node:crypto - Timing-safe password comparison (SHA-256)
- node:fs/promises - File system operations (build scripts)

## Configuration

**Environment:**
- `.env.local` (not committed) - Local development secrets
- `env.example` - Template of all required env vars
- Baked into build: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Runtime only (never baked): `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `RESEND_API_KEY`, contact form email addresses

**Build:**
- `tsconfig.json` - TypeScript compiler options (ES2017 target, strict mode, path alias `@/*`)
- `next.config.ts - Standalone output, security headers (HSTS, CSP TODO, X-Frame-Options), Turbopack root pinning
- `eslint.config.mjs` - ESLint rules (Next.js Core Web Vitals, TypeScript)
- `vitest.setup.ts` - Vitest configuration
- `playwright.config.ts` - E2E test configuration (located in `e2e/`)

## Platform Requirements

**Development:**
- Node.js 20+
- Bun package manager
- macOS, Linux, or Windows (with WSL)
- `.env.local` file with secrets (template: `env.example`)

**Production:**
- Docker-based deployment via Dokploy (auto-deploys on `main` branch)
- Deployed to: onglessanssouci.com
- Node.js 20 Alpine runtime
- Memory: 512 MB typical, scales with traffic

---

*Stack analysis: 2026-06-17*
