# Testing Patterns

**Analysis Date:** 2026-06-17

## Test Framework

**Runner:**
- **Vitest** (latest)
- Config: `vitest.config.ts`
- Environment: jsdom (for React component testing)

**Assertion Library:**
- **@testing-library/react** (React Testing Library)
- **@testing-library/jest-dom/vitest** (for DOM matchers like `toBeInTheDocument()`, `toHaveAttribute()`, `toHaveCount()`)

**E2E Testing:**
- **Playwright** (@playwright/test)
- Test files: `e2e/*.spec.ts` (separate from unit tests)
- Excluded from Vitest via config: `exclude: ["e2e/**", ...]`

**Run Commands:**
```bash
npm run test                # Run all unit tests (Vitest)
npm run test:watch        # Watch mode for unit tests
npm run test:coverage     # Generate coverage report
npx playwright test       # Run E2E tests
npx playwright test --ui  # E2E with UI
```

## Test File Organization

**Location:**
- **Unit/component tests:** Co-located with source files
  - Example: `src/components/WidgetEmbed.tsx` → `src/components/WidgetEmbed.test.tsx`
- **Server-side tests:** Co-located in source tree
  - Example: `src/proxy.ts` → `src/proxy.test.ts`
  - Layout metadata tests: `src/app/clientportal/layout.test.ts`
- **E2E tests:** Separate `e2e/` directory
  - Example: `e2e/homepage.spec.ts`

**Naming:**
- Pattern: `{ModuleName}.test.ts` or `{ModuleName}.spec.ts` (`.test` preferred)
- Vitest config includes both: `include: ["src/**/*.{test,spec}.{ts,tsx}"]`

**Structure:**
```
src/
├── components/
│   ├── WidgetEmbed.tsx
│   ├── WidgetEmbed.test.tsx
│   └── QueueWidget.test.tsx
├── lib/
│   ├── email.ts
│   └── session.ts
├── app/
│   └── api/
│       └── contact/
│           └── route.ts
└── proxy.ts
└── proxy.test.ts

e2e/
└── homepage.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { ComponentName } from "./ComponentName";

afterEach(cleanup);  // Clean up DOM after each test

describe("ComponentName", () => {
  it("renders with expected props (T1)", () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("handles user interaction (T2)", () => {
    render(<ComponentName />);
    // arrange, act, assert
  });
});
```

**Patterns:**
- **Setup:** Import test utilities and component; call `afterEach(cleanup)` to reset DOM
- **Teardown:** Implicit via `cleanup()` after each test
- **Test naming:** Descriptive human-readable names with optional test case ID (T1, T2, etc.)
- **Assertion style:** Expect-based (`expect(...).toBeX()`)

## Mocking

**Framework:** Vitest's built-in mock support (no explicit external mocking library detected)

**Patterns:**
- **DOM queries:** Use React Testing Library `render()`, `screen`, `getByRole()`, `getByText()`, etc.
- **Attribute testing:** Direct DOM inspection via `querySelector()` combined with `expect()`

Example from `src/components/WidgetEmbed.test.tsx`:
```typescript
function injectedScript(src: string) {
  return document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
}

describe("WidgetEmbed storeAttr", () => {
  it("uses data-account-store when storeAttr is set (T2)", () => {
    const src = "https://example.test/account.js";
    render(<WidgetEmbed src={src} store="SS" storeAttr="data-account-store" fallbackLabel="client portal" />);
    const script = injectedScript(src);
    expect(script).not.toBeNull();
    expect(script!.getAttribute("data-account-store")).toBe("SS");
  });
});
```

**What to Mock:**
- External API calls (fetch responses)
- Browser APIs with side effects (localStorage, sessionStorage when testing frequency logic)

**What NOT to Mock:**
- React component renders (let them render to jsdom)
- Event handlers and user interactions (use `userEvent` or direct DOM manipulation)
- DOM queries (use real DOM via jsdom environment)

## Fixtures and Factories

**Test Data:**
- Inline literal values in test cases (no shared factories)
- Constants defined at test file module level for reuse within a suite

Example from `src/components/ClientPortalWidget.test.tsx`:
```typescript
const SRC = "https://app.onglessanssouci.com/widgets/client-account-widget.js";

describe("ClientPortalWidget", () => {
  it("injects the client-account script with data-account-store=SS (T1, T2)", () => {
    // Uses SRC constant
  });
});
```

**Location:**
- Fixtures defined in test files themselves (not in separate `__fixtures__` or `fixtures/` directories)
- No dedicated fixture factory pattern observed

## Coverage

**Requirements:** No explicit coverage enforcement configured

**View Coverage:**
```bash
npm run test:coverage    # Generate coverage report
```

**Target (implied):** 80%+ coverage per global testing guidelines, but not enforced in CI

## Test Types

**Unit Tests:**
- Scope: Individual functions, React components, hooks
- Approach: Render component to jsdom, assert DOM state, verify attributes and class names
- Example: `WidgetEmbed.test.tsx` tests prop handling, theme application, loading/error states

**Integration Tests:**
- Scope: API routes, end-to-end request/response flow
- Approach: Create mock request objects, call handler directly, verify response structure
- Example: `proxy.test.ts` tests routing logic for locale prefixing

Example from `src/proxy.test.ts`:
```typescript
function req(path: string) {
  return new NextRequest(new URL(`http://localhost${path}`));
}

describe("proxy locale routing", () => {
  it("does not locale-prefix /clientportal (T1: route reachable un-prefixed)", async () => {
    const res = await proxy(req("/clientportal"));
    expect(res.headers.get("location")).toBeNull();
  });
});
```

**E2E Tests:**
- Scope: Critical user flows (navigation, form submission, visual rendering)
- Framework: Playwright
- Approach: Browser automation, real navigation, visual assertions

Example from `e2e/homepage.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("homepage enhancements (/fr)", () => {
  test("hero has a Call Now tel link", async ({ page }) => {
    await page.goto("/fr");
    const call = page.getByRole("link", { name: /appelez-nous/i }).first();
    await expect(call).toHaveAttribute("href", "tel:+14505056450");
  });

  test("renders 10 testimonial cards", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.getByText(/Marie-Ève L\./).first()).toBeVisible();
  });
});
```

## Common Patterns

**Async Testing:**
- Mark `it()` callback as `async` when awaiting promises
- Example: `it("does not locale-prefix /clientportal", async () => { ... })`
- Vitest automatically waits for async test completion

**Error Testing:**
- Test error paths via discriminated union returns (not exception throwing)
- Example: Verify `EmailResult` returns `{ ok: false, reason: "send_failed", detail: "..." }`

**Component State Testing:**
- Render, interact, assert DOM changes
- Example: Set `theme="dark"`, verify spinner has class `border-mocha`

```typescript
it("renders dark loading overlay theme=dark (T1)", () => {
  render(<WidgetEmbed src={src} store="SS" fallbackLabel="queue" theme="dark" />);
  const spinner = screen.getByRole("status");
  expect(spinner.className).toContain("border-mocha");
});
```

**Cleanup Pattern:**
- Always include `afterEach(cleanup)` to unmount components and reset jsdom between tests
- Prevents test pollution and memory leaks

## Test Naming Convention

**Format:** `"action/condition description (test-case-id)"`

- Test case IDs (T1, T2, etc.) track requirements or specifications
- Example: 
  - `"uses data-account-store when storeAttr is set (T2)"`
  - `"does not locale-prefix /clientportal (T1: route reachable un-prefixed)"`
  - `"renders dark loading overlay theme=dark (T1)"`

## Test Organization in Suites

Large test files organize related tests into nested `describe()` blocks:

Example from `src/components/WidgetEmbed.test.tsx`:
```typescript
describe("WidgetEmbed storeAttr", () => {
  it("uses data-account-store when storeAttr is set (T2)", () => { ... });
  it("defaults to data-store when storeAttr omitted (T3 regression)", () => { ... });
});

describe("WidgetEmbed theme", () => {
  it("renders dark loading overlay theme=dark (T1)", () => { ... });
  it("renders light loading overlay (default)", () => { ... });
});
```

## Known Test Gaps

- **Email delivery:** `sendContactEmail()` tested indirectly via API route; no isolated unit test for Resend integration
- **PopupHost frequency logic:** `shouldShow()` and `markSeen()` not directly tested; covered via PopupHost component renders
- **Locale matching:** `matchLocale()` in `i18n.ts` has no explicit tests (tested indirectly via proxy routing)
- **Admin authentication:** `verifyPassword()`, `isAuthed()` have no isolated tests; covered via admin route handler tests (not present in current codebase)

---

*Testing analysis: 2026-06-17*
