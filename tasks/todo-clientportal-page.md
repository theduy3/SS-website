<!-- s1 metadata
task-name: clientportal-page
worktree: clientportal-page
speckit: false
scope: small
status: plan-approved
repo: /Users/theduy/Repo/SS-website
created-at: 2026-06-12
-->

# `/clientportal` Page Implementation Plan

> **For agentic workers:** scope is **small** → single-context TDD via `test-driven-development`. Steps use checkbox (`- [ ]`) syntax. Spec: `tasks/spec-clientportal-page.md`.

**Goal:** Add a standalone `/clientportal` page that embeds the SalonX client-account widget, mirroring the existing `/checkin` kiosk pattern.

**Architecture:** Reuse the shared `WidgetEmbed` injector. The new widget reads `data-account-store` (not `data-store`), so `WidgetEmbed` gains an optional `storeAttr` prop (default `"data-store"` — checkin/queue unchanged). A new `ClientPortalWidget` wraps it; a standalone `clientportal/` route (page + noindex layout) hosts it. Light theme, in-place mount, no `data-lang`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript. **New:** Vitest + React Testing Library + jsdom (repo's first unit-test runner).

---

## Must-Haves (goal-backward verification anchors)

**Truths** (each → a failing test first):
- **T1** — `/clientportal` renders the client-account widget: `ClientPortalWidget` injects a `<script>` with `src` = `https://app.onglessanssouci.com/widgets/client-account-widget.js`.
- **T2** — The injected `<script>` carries `data-account-store="SS"` (so the widget's `querySelectorAll("script[data-account-store]")` self-lookup succeeds).
- **T3** — Regression: with no `storeAttr` (checkin/queue path), `WidgetEmbed` injects `data-store` and NOT `data-account-store`.
- **T4** — `clientportal/layout.tsx` exports `metadata.robots = { index: false, follow: false }` (noindex/nofollow).
- **T5** — `WidgetEmbed` shows the loading overlay (`role="status"`) before the script fires `onload`.

**Artifacts** (must exist, substantive):
- `src/components/ClientPortalWidget.tsx`
- `src/app/clientportal/page.tsx`
- `src/app/clientportal/layout.tsx`
- `vitest.config.ts`, `vitest.setup.ts`
- `src/components/WidgetEmbed.test.tsx`, `src/components/ClientPortalWidget.test.tsx`, `src/app/clientportal/layout.test.ts`

**Key links:**
- `ClientPortalWidget` imports `WidgetEmbed` and passes `storeAttr="data-account-store"`.
- `clientportal/page.tsx` imports `{ ClientPortalWidget }`.
- `package.json` `"test"` script runs Vitest.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `vitest.config.ts` | jsdom env, React plugin, exclude Playwright `e2e/` | Create |
| `vitest.setup.ts` | `@testing-library/jest-dom` matchers | Create |
| `package.json` | add `test` / `test:watch` scripts + devDeps | Modify |
| `src/components/WidgetEmbed.tsx` | shared injector — add `storeAttr` prop | Modify |
| `src/components/WidgetEmbed.test.tsx` | T2/T3/T5 unit tests | Create |
| `src/components/ClientPortalWidget.tsx` | wraps WidgetEmbed for the account widget | Create |
| `src/components/ClientPortalWidget.test.tsx` | T1/T2 unit tests | Create |
| `src/app/clientportal/layout.tsx` | noindex standalone shell | Create |
| `src/app/clientportal/layout.test.ts` | T4 metadata test | Create |
| `src/app/clientportal/page.tsx` | renders ClientPortalWidget | Create |

---

## Implementation Plan

### Task 1: Bootstrap Vitest unit-test runner

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Install dev dependencies**

```bash
bun add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/dom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Unit tests run in jsdom. Playwright specs live in e2e/ and are excluded so
// `vitest` and `playwright test` never pick up each other's files.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add scripts to `package.json`**

In the `"scripts"` block, add:

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 5: Add a smoke test to prove the runner works**

Create `src/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest runner", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run it**

Run: `bun run test`
Expected: PASS (1 test). Confirms jsdom + config load.

- [ ] **Step 7: Delete the smoke test and commit**

```bash
rm src/smoke.test.ts
git add vitest.config.ts vitest.setup.ts package.json bun.lock
git commit -m "test: bootstrap vitest + react testing library"
```

---

### Task 2: `WidgetEmbed` — configurable `storeAttr` (T2, T3, T5)

**Files:**
- Test: `src/components/WidgetEmbed.test.tsx`
- Modify: `src/components/WidgetEmbed.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/WidgetEmbed.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { WidgetEmbed } from "./WidgetEmbed";

afterEach(cleanup);

// In jsdom the injected <script> never loads (no network/exec), so the element
// and its attributes are observable in the DOM while status stays "loading".
function injectedScript(src: string) {
  return document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
}

describe("WidgetEmbed storeAttr", () => {
  it("uses data-account-store when storeAttr is set (T2)", () => {
    const src = "https://example.test/account.js";
    render(
      <WidgetEmbed
        src={src}
        store="SS"
        storeAttr="data-account-store"
        fallbackLabel="client portal"
      />,
    );
    const script = injectedScript(src);
    expect(script).not.toBeNull();
    expect(script!.getAttribute("data-account-store")).toBe("SS");
    expect(script!.getAttribute("data-store")).toBeNull();
  });

  it("defaults to data-store when storeAttr omitted (T3 regression)", () => {
    const src = "https://example.test/checkin.js";
    render(<WidgetEmbed src={src} store="SS" fallbackLabel="check-in" />);
    const script = injectedScript(src);
    expect(script).not.toBeNull();
    expect(script!.getAttribute("data-store")).toBe("SS");
    expect(script!.getAttribute("data-account-store")).toBeNull();
  });

  it("shows the loading overlay before the script loads (T5)", () => {
    render(
      <WidgetEmbed
        src="https://example.test/loading.js"
        store="SS"
        fallbackLabel="check-in"
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun run test src/components/WidgetEmbed.test.tsx`
Expected: FAIL — the `data-account-store` test fails (current code always sets `data-store`); the `storeAttr` prop doesn't exist on the type. (The default + loading tests may already pass.)

- [ ] **Step 3: Add the `storeAttr` prop**

In `src/components/WidgetEmbed.tsx`:

Add to the props type (after `fallbackLabel`):

```tsx
  // Attribute the widget reads to locate its <script> and identify the store.
  // Defaults to "data-store" (check-in, queue). The client-account widget reads
  // "data-account-store" instead.
  storeAttr?: string;
```

Add `storeAttr = "data-store"` to the destructured params (alongside `theme = "light"`).

Change the injection line:

```tsx
    script.setAttribute(storeAttr, store);
```

Add `storeAttr` to the effect dependency array:

```tsx
  }, [src, store, storeAttr, attempt]);
```

- [ ] **Step 4: Run to verify it passes**

Run: `bun run test src/components/WidgetEmbed.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/WidgetEmbed.tsx src/components/WidgetEmbed.test.tsx
git commit -m "feat: add configurable storeAttr to WidgetEmbed"
```

---

### Task 3: `ClientPortalWidget` component (T1, T2)

**Files:**
- Test: `src/components/ClientPortalWidget.test.tsx`
- Create: `src/components/ClientPortalWidget.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ClientPortalWidget.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ClientPortalWidget } from "./ClientPortalWidget";

afterEach(cleanup);

const SRC = "https://app.onglessanssouci.com/widgets/client-account-widget.js";

describe("ClientPortalWidget", () => {
  it("injects the client-account script with data-account-store=SS (T1, T2)", () => {
    render(<ClientPortalWidget />);
    const script = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    expect(script).not.toBeNull();
    expect(script!.getAttribute("data-account-store")).toBe("SS");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun run test src/components/ClientPortalWidget.test.tsx`
Expected: FAIL — module `./ClientPortalWidget` not found.

- [ ] **Step 3: Create the component**

Create `src/components/ClientPortalWidget.tsx`:

```tsx
"use client";

import { WidgetEmbed } from "@/components/WidgetEmbed";

const WIDGET_SRC =
  "https://app.onglessanssouci.com/widgets/client-account-widget.js";
const STORE = "SS";

// Embeds the SalonX client-account widget on the un-localized /clientportal
// page. Unlike check-in/queue, this widget reads data-account-store to find its
// own <script>, so we pass storeAttr explicitly. Injection, loading and
// error/retry handling live in WidgetEmbed. Light theme (default).
export function ClientPortalWidget() {
  return (
    <WidgetEmbed
      src={WIDGET_SRC}
      store={STORE}
      storeAttr="data-account-store"
      fallbackLabel="client portal"
    />
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `bun run test src/components/ClientPortalWidget.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/ClientPortalWidget.tsx src/components/ClientPortalWidget.test.tsx
git commit -m "feat: add ClientPortalWidget"
```

---

### Task 4: `/clientportal` route — layout + page (T4)

**Files:**
- Test: `src/app/clientportal/layout.test.ts`
- Create: `src/app/clientportal/layout.tsx`, `src/app/clientportal/page.tsx`

- [ ] **Step 1: Write the failing metadata test**

Create `src/app/clientportal/layout.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { metadata } from "./layout";

describe("clientportal layout metadata", () => {
  it("is noindex / nofollow (T4)", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("has the Account title", () => {
    expect(metadata.title).toBe("Account");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun run test src/app/clientportal/layout.test.ts`
Expected: FAIL — module `./layout` not found.

- [ ] **Step 3: Create the layout**

Create `src/app/clientportal/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "../globals.css";

// Standalone root layout for the un-localized /clientportal page (sibling to
// [lang] and admin). Intentionally minimal — no Header/Footer/popups — and kept
// out of search engines (private customer account surface).
export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-fog text-espresso">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Create the page**

Create `src/app/clientportal/page.tsx`:

```tsx
import { ClientPortalWidget } from "@/components/ClientPortalWidget";

// Empty standalone page — only loads the third-party client-account widget.
// Metadata (title + noindex) lives in the sibling layout.
export default function ClientPortalPage() {
  return <ClientPortalWidget />;
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `bun run test src/app/clientportal/layout.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/clientportal/layout.tsx src/app/clientportal/page.tsx src/app/clientportal/layout.test.ts
git commit -m "feat: add /clientportal route"
```

---

### Task 5: Full verification + build

- [ ] **Step 1: Run the whole unit suite**

Run: `bun run test`
Expected: PASS — all tests (WidgetEmbed ×3, ClientPortalWidget ×1, layout ×2). Confirms T2/T3 isolation, T1, T4, T5.

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: no errors in new files.

- [ ] **Step 3: Production build (catches App Router / type errors)**

Run: `bun run build`
Expected: build succeeds; `/clientportal` appears in the route list.

- [ ] **Step 4: Manual smoke (T1 live — third-party widget actually renders)**

Run: `bun run dev`, open `http://localhost:3000/clientportal`.
Expected: spinner → client-account widget renders (`#salonx-account-widget` in DOM). Kill network + Retry → recovers. View source → `robots noindex`. `/checkin` and `/queue` still load (regression check on the shared component).

- [ ] **Step 5: Final commit if anything changed**

```bash
git add -A
git commit -m "test: verify clientportal page end-to-end" || echo "nothing to commit"
```

---

## Self-Review

- **Spec coverage:** T1→Task 3, T2→Tasks 2+3, T3→Task 2, T4→Task 4, T5→Task 2. All 5 truths mapped. WidgetEmbed edit (spec §Files-to-edit) → Task 2. All 3 new files (spec §Files-to-create) → Tasks 3+4. Vitest bootstrap (s1 precondition) → Task 1. ✅
- **Placeholders:** none — every code step shows full content.
- **Type consistency:** `storeAttr` prop name identical across Task 2 (def), Task 3 (use), spec. `ClientPortalWidget` named export used by both its test and the page import. `STORE="SS"`, `WIDGET_SRC` const consistent.
- **Convention match:** layout/page cloned verbatim from `checkin/` (named import `{ ClientPortalWidget }`, default-export page, `bg-fog text-espresso`, `robots index:false follow:false`). ✅

## Out of Scope
Auth/session (widget owns it), localized route / `data-lang`, Header/Footer chrome, widget-bundle changes.
