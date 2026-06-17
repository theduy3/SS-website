# Coding Conventions

**Analysis Date:** 2026-06-17

## Naming Patterns

**Files:**
- PascalCase for React components: `WidgetEmbed.tsx`, `PageHeader.tsx`, `ClientPortalWidget.tsx`
- camelCase for utilities and non-component modules: `email.ts`, `session.ts`, `i18n.ts`, `proxy.ts`
- Test files co-located with source: `WidgetEmbed.test.tsx`, `proxy.test.ts`
- Special Next.js files: `layout.ts`, `route.ts`, `middleware.ts`, `robots.ts`, `sitemap.ts`

**Functions:**
- camelCase for all functions: `sendContactEmail()`, `handleSubmit()`, `markSeen()`, `matchLocale()`
- Verb-first for action functions: `getSession()`, `isAuthed()`, `verifyPassword()`, `deletePopup()`
- Predicate functions use `is`/`has` prefix: `isLocale()`, `isAuthed()`, `isAuthConfigured()`, `shouldShow()`
- Custom hooks use `use` prefix: `useReducedMotion` (from Framer Motion), `useState`, `useEffect`

**Variables:**
- camelCase for all local and module-level variables
- UPPERCASE_SNAKE_CASE for constants: `LOCALE_COOKIE`, `SESSION_COOKIE`, `LOGIN_PATHS`, `STANDALONE_PATHS`, `RESEND_ENDPOINT`
- Type variables use single uppercase letter or descriptive PascalCase: `T`, `Status`, `EmailResult`
- State variables: `[value, setValue]` pattern via `useState`

**Types:**
- PascalCase for all type/interface names: `ContactPayload`, `EmailResult`, `SessionData`, `Popup`, `Locale`, `Status`
- Discriminated union types use string literals: `type Status = "loading" | "ready" | "error"`
- Generic type parameters: `StoreResult<T>`, `Repository<T>`, `Dictionary`

## Code Style

**Formatting:**
- Tool: **ESLint** with Next.js config (`eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`)
- Config file: `eslint.config.mjs`
- No explicit Prettier config detected (Next.js + ESLint enforce formatting via lint rules)

**Linting:**
- Enforced rules: Next.js core web vitals, TypeScript strict rules
- Ignored directories: `.next/**`, `out/**`, `build/**`
- Run: `npm run lint` (or `bun run lint`)

**Line Length:**
- Soft limit ~80–100 characters observed in practice
- Template strings and JSX allowed to exceed for readability

**Import Style:**
- Prefer named imports over default imports
- Always use type keyword for type imports: `import type { Dictionary } from "@/lib/dictionary"`
- Use path aliases consistently: `@/lib/*`, `@/components/*`

## Import Organization

**Order:**
1. Node.js built-ins: `import { createHash } from "node:crypto"`
2. External packages: `import React, { useState } from "react"`, `import { z } from "zod"`, `import { framer-motion }`
3. Next.js imports: `import { NextResponse } from "next/server"`, `import Image from "next/image"`
4. Internal absolute imports: `import { site } from "@/lib/site"`, `import type { Locale } from "@/lib/i18n"`
5. Relative imports (rare, usually avoided): `import { Reveal } from "./Reveal"`

**Path Aliases:**
- `@/*` → `./src/*` (defined in `tsconfig.json`)
- All cross-file imports use `@/` prefix; never use relative paths like `../../../lib/`

## Error Handling

**Patterns:**
- **Try-catch with error re-throwing:** Catch errors, log context if needed, re-throw or return typed error result
- **Typed error results:** Use discriminated unions for success/failure states instead of throwing

Example from `src/lib/email.ts`:
```typescript
export type EmailResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "send_failed"; detail: string };

export async function sendContactEmail(data: ContactPayload): Promise<EmailResult> {
  if (!apiKey || !from) {
    return { ok: false, reason: "not_configured" };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, { ... });
    if (!res.ok) {
      return { ok: false, reason: "send_failed", detail: `Resend responded ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "send_failed", detail: err instanceof Error ? err.message : "Unknown" };
  }
}
```

- **Conditional logging:** Use console-based logging (no external logging library). Log errors to console in dev/prod but surface user-friendly messages in UI
- **Catch-all handlers in effects:** Silent catch (no-op) for non-critical operations like localStorage access

Example from `src/components/PopupHost.tsx`:
```typescript
.catch(() => {});  // Silently ignore fetch failures for popups
```

- **Validation with Zod:** All form submissions and API requests use `zod` schema validation

Example from `src/app/api/contact/route.ts`:
```typescript
const ContactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  email: z.email("A valid email is required"),
});

const parsed = ContactSchema.safeParse(body);
if (!parsed.success) {
  const message = parsed.error.issues[0]?.message ?? "Validation failed";
  return NextResponse.json({ success: false, error: message }, { status: 422 });
}
```

## Logging

**Framework:** Native `console.log`, `console.error`, `console.warn` (no external logging library)

**Patterns:**
- **Server-side (API routes):** Log errors and important decisions with context
- **Client-side (React components):** Avoid console.log in production code (per linting rules); use only for debugging
- **Format:** Prefix logs with a module identifier: `[contact]`, `[popup]`, `[admin]`

Example from `src/app/api/contact/route.ts`:
```typescript
console.error("[contact] email send failed:", result.detail);
console.warn("[contact] email provider not configured — accepting in development:", parsed.data);
```

## Comments

**When to Comment:**
- Complex business logic that isn't self-explanatory
- Trade-offs or architectural decisions (e.g., why a component uses `useRef` instead of state)
- Non-obvious implementation details (e.g., why a script is injected imperatively instead of declaratively)

Example from `src/components/WidgetEmbed.tsx`:
```typescript
// Shared embed for the SalonX kiosk widgets (check-in, technician queue) and the
// client-account widget. We inject the widget <script> imperatively into a ref'd
// container that carries no JSX children, so React never reconciles inside it.
```

**JSDoc/TSDoc:**
- Not systematically used; function parameters and return types are documented via TypeScript signatures
- Where used, follows standard JSDoc format with `@param`, `@returns`, `@throws`
- Module-level comments explain purpose before exports

**Inline Comments:**
- Explain WHY, not WHAT: `// cleared by Strict Mode on dev reload` not `// clear the container`
- Use sparingly; prefer self-documenting code

## Function Design

**Size:** 
- Typical range: 10–50 lines
- Max observed: ~100 lines (e.g., `WidgetEmbed.tsx`, `PopupHost.tsx`)
- Larger functions break out concerns into helpers or separate files

**Parameters:**
- Single object param for functions with 2+ parameters
- Example from `src/components/WidgetEmbed.tsx`:
```typescript
export function WidgetEmbed({
  src,
  store,
  storeAttr = "data-store",
  fallbackLabel,
  theme = "light",
}: { ... }) { ... }
```

**Return Values:**
- Explicit return types required (TypeScript strict mode)
- Async functions return `Promise<T>` where T is clearly typed
- Functions returning success/failure use discriminated union types

**Immutability:**
- Spread operator for object updates: `return { ...user, name }`
- No mutation of function parameters or external state
- React state updates via setter functions, never direct mutation

Example from `src/components/WidgetEmbed.tsx`:
```typescript
const [attempt, setAttempt] = useState(0);
setAttempt((n) => n + 1);  // Immutable state update
```

## Module Design

**Exports:**
- Explicit named exports preferred over default exports
- Example: `export function WidgetEmbed({ ... }) { ... }`
- Default exports only for page/layout components in Next.js

**Barrel Files:**
- No index.ts barrel files observed
- Each component/utility imported directly by path

**Module Scope:**
- Constants defined at module top: `const LOCALE_COOKIE = "NEXT_LOCALE"`
- Config objects exported as constants: `export const sessionOptions: SessionOptions = { ... }`
- Functions defined after types and constants

Example module structure (`src/lib/session.ts`):
```typescript
// 1. Module-level comment explaining purpose
// 2. Type definitions: SessionData
// 3. Constants: SESSION_COOKIE, sessionSecret, sessionOptions
// 4. Functions: isAuthConfigured(), verifyPassword(), getSession(), isAuthed()
```

## Special Patterns

**Next.js App Router:**
- Server Components by default; `"use client"` only for interactive components
- Async layouts and pages; await data before rendering
- Middleware via single `proxy` export (not `middleware.ts` — renamed in Next.js 16)

**React Component Structure:**
- Props as single typed object parameter
- Inline utility functions for component-specific helpers
- useEffect dependencies explicitly listed

**CSS:**
- Tailwind CSS classes used directly (no CSS modules)
- Custom color palette via theme tokens: `bg-espresso`, `text-cream`, `border-mocha`, `bg-fog`

---

*Convention analysis: 2026-06-17*
