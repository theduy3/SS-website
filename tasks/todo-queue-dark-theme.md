<!-- s1 metadata
task-name: queue-dark-theme
worktree: queue-dark-theme
speckit: false
scope: small
status: plan-approved
repo: /Users/theduy/Repo/SS-website
created-at: 2026-06-12
-->

# Queue Dark-Theme Implementation Plan

> **For agentic workers:** scope is **small** → single-context TDD via `test-driven-development`. Steps use checkbox (`- [ ]`) syntax. Spec: `tasks/spec-queue-dark-theme.md`.

**Goal:** Land the uncommitted `/queue` dark-theme work (3 files) on top of the merged `storeAttr` change, with unit tests and a live re-verify.

**Architecture:** Re-apply the dark-theme edits in a fresh worktree off `origin/main` (which already carries `storeAttr`). `queue/layout.tsx` and `QueueWidget.tsx` apply verbatim; `WidgetEmbed.tsx` is rewritten as the storeAttr base + theme additions (orthogonal — both prop blocks coexist). The dirty `main` working tree is the backup until merge.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest + React Testing Library (already on `origin/main`).

---

## Must-Haves (goal-backward verification anchors)

**Truths** (each → a failing test first, except T6 = build/integration):
- **T1** — `theme="dark"`: loading overlay uses `bg-[#0b1220]`; spinner uses `border-mocha border-t-cream`.
- **T2** — default (no `theme`): loading overlay uses `bg-fog`; spinner uses `border-tan border-t-espresso`. (Regression.)
- **T3** — `storeAttr` coexists: default injects `data-store`; `storeAttr="data-account-store"` injects that and not `data-store`. (Regression of merged behavior.)
- **T4** — dark + script `onload` (`status="ready"`) collapses the container (outer wrapper loses `min-h-screen`); light + ready keeps `min-h-screen`.
- **T5** — `QueueWidget` renders the dark overlay (`theme="dark"` wired through, not dropped).
- **T6** — shipped `WidgetEmbed.tsx` contains BOTH `storeAttr` and `theme`; `bun run build` green; `/checkin` + `/clientportal` still light.

**Artifacts:**
- `src/components/WidgetEmbed.tsx` (merged), `src/components/WidgetEmbed.test.tsx` (extended)
- `src/components/QueueWidget.tsx` (theme), `src/components/QueueWidget.test.tsx` (new)
- `src/app/queue/layout.tsx` (dark body)

**Key links:** `QueueWidget` passes `theme="dark"` to `WidgetEmbed`; `WidgetEmbed` keeps `setAttribute(storeAttr, store)` + `storeAttr` in the effect deps.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/components/WidgetEmbed.tsx` | storeAttr base + theme (overlay colors, collapse height) | Modify (rewrite) |
| `src/components/WidgetEmbed.test.tsx` | T1/T2/T4 (+ existing T3/T5-loading) | Modify (extend) |
| `src/components/QueueWidget.tsx` | pass `theme="dark"` | Modify |
| `src/components/QueueWidget.test.tsx` | T5 | Create |
| `src/app/queue/layout.tsx` | dark body shell | Modify |

---

## Implementation Plan

### Task 1: WidgetEmbed theme support (T1, T2, T4)

**Files:**
- Test: `src/components/WidgetEmbed.test.tsx` (extend)
- Modify: `src/components/WidgetEmbed.tsx`

- [ ] **Step 1: Append the failing theme tests**

Add to the end of `src/components/WidgetEmbed.test.tsx`, and add `act` to the
existing react-testing-library import at the top so it reads
`import { render, cleanup, screen, act } from "@testing-library/react";`:

```tsx
describe("WidgetEmbed theme", () => {
  it("renders a dark loading overlay for theme=dark (T1)", () => {
    render(
      <WidgetEmbed
        src="https://example.test/q.js"
        store="SS"
        fallbackLabel="queue"
        theme="dark"
      />,
    );
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("border-mocha");
    expect(spinner.className).toContain("border-t-cream");
    expect(spinner.parentElement!.className).toContain("bg-[#0b1220]");
  });

  it("renders a light loading overlay by default (T2)", () => {
    render(
      <WidgetEmbed
        src="https://example.test/c.js"
        store="SS"
        fallbackLabel="check-in"
      />,
    );
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("border-tan");
    expect(spinner.parentElement!.className).toContain("bg-fog");
  });

  it("collapses height when the dark widget is ready (T4)", () => {
    const src = "https://example.test/queue-ready.js";
    const { container } = render(
      <WidgetEmbed src={src} store="SS" fallbackLabel="queue" theme="dark" />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-screen");
    const script = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    )!;
    act(() => {
      script.onload!(new Event("load"));
    });
    expect(wrapper.className).not.toContain("min-h-screen");
  });

  it("keeps full height when a light widget is ready", () => {
    const src = "https://example.test/checkin-ready.js";
    const { container } = render(
      <WidgetEmbed src={src} store="SS" fallbackLabel="check-in" />,
    );
    const script = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    )!;
    act(() => {
      script.onload!(new Event("load"));
    });
    expect((container.firstChild as HTMLElement).className).toContain(
      "min-h-screen",
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun run test src/components/WidgetEmbed.test.tsx`
Expected: FAIL — `theme` prop doesn't exist; dark overlay assertions fail (still `bg-fog`); collapse assertion fails (always `min-h-screen`).

- [ ] **Step 3: Rewrite `src/components/WidgetEmbed.tsx` (storeAttr base + theme)**

Replace the whole file with:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Status = "loading" | "ready" | "error";

// Shared embed for the SalonX kiosk widgets (check-in, technician queue) and the
// client-account widget. We inject the widget <script> imperatively into a ref'd
// container that carries no JSX children, so React never reconciles inside it.
// Where the widget mounts its UI varies: check-in/client-account insert in place
// next to the script; the queue widget appends its own root
// (#salonx-queue-widget) to <body>, ignoring our container — so once it's ready
// we collapse the container to zero height (dark theme) instead of leaving a
// full-viewport empty block above the board. A sibling overlay, fully
// React-managed, shows a spinner while loading and an error fallback (with retry)
// on failure; it needs a full-height canvas, so the container stays min-h-screen
// until the script is ready. Unlike the booking widget, no data-lang is set — the
// kiosk pages are un-localized. The attribute the widget reads to find its own
// script varies: check-in/queue use "data-store" (the default); the
// client-account widget uses "data-account-store" (pass storeAttr).
export function WidgetEmbed({
  src,
  store,
  storeAttr = "data-store",
  fallbackLabel,
  theme = "light",
}: {
  src: string;
  store: string;
  // Attribute the widget reads to locate its <script> and identify the store.
  // Defaults to "data-store"; the client-account widget needs "data-account-store".
  storeAttr?: string;
  // Names the widget in the error message, e.g. "check-in" or "queue".
  fallbackLabel: string;
  // Themes the loading/error overlay to match the embedded widget. The queue
  // widget paints itself dark full-screen, so its overlay must be dark too; the
  // check-in and client-account widgets are light (the default).
  theme?: "light" | "dark";
}) {
  const dark = theme === "dark";
  const overlayBg = dark ? "bg-[#0b1220]" : "bg-fog";
  const spinnerBorder = dark
    ? "border-mocha border-t-cream"
    : "border-tan border-t-espresso";
  const errorText = dark ? "text-fog" : "text-mocha";
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  // Full-height while loading/error (the overlay needs a viewport-tall canvas)
  // and for the light widgets (unchanged). Collapse for the ready dark queue
  // board, which mounts to <body> and would otherwise be pushed a full screen
  // down.
  const fullHeight = !dark || status !== "ready";
  const heightClass = fullHeight ? "min-h-screen" : "";
  // Bumping this re-runs the injection effect — drives the retry button.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let cancelled = false;
    setStatus("loading");
    // Clear any prior injection (retry, Strict Mode double-effect, re-mounts).
    container.replaceChildren();

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute(storeAttr, store);
    script.onload = () => {
      if (!cancelled) setStatus("ready");
    };
    script.onerror = () => {
      if (!cancelled) setStatus("error");
    };
    container.appendChild(script);

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [src, store, storeAttr, attempt]);

  return (
    <div className={`relative ${heightClass}`}>
      <div ref={ref} className={heightClass} />

      {status === "loading" && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${overlayBg}`}
        >
          <span
            role="status"
            aria-label="Loading"
            className={`size-10 animate-spin rounded-full border-4 ${spinnerBorder}`}
          />
        </div>
      )}

      {status === "error" && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center ${overlayBg}`}
        >
          <p className={`max-w-sm text-lg leading-relaxed ${errorText}`}>
            Unable to load the {fallbackLabel}. Please check your connection and
            try again.
          </p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="inline-flex items-center justify-center rounded-pill bg-espresso px-8 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-mocha"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes (incl. existing storeAttr tests — T3)**

Run: `bun run test src/components/WidgetEmbed.test.tsx`
Expected: PASS — all tests, including the pre-existing storeAttr/`data-account-store` cases (T3) and the new theme cases (T1/T2/T4).

- [ ] **Step 5: Commit**

```bash
git add src/components/WidgetEmbed.tsx src/components/WidgetEmbed.test.tsx
git commit -m "feat: add dark theme support to WidgetEmbed"
```

---

### Task 2: QueueWidget passes theme=dark (T5)

**Files:**
- Test: `src/components/QueueWidget.test.tsx` (create)
- Modify: `src/components/QueueWidget.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/QueueWidget.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { QueueWidget } from "./QueueWidget";

afterEach(cleanup);

describe("QueueWidget", () => {
  it("renders the dark overlay (theme=dark wired through) (T5)", () => {
    render(<QueueWidget />);
    const spinner = screen.getByRole("status");
    expect(spinner.parentElement!.className).toContain("bg-[#0b1220]");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun run test src/components/QueueWidget.test.tsx`
Expected: FAIL — QueueWidget passes no `theme`, so the overlay is `bg-fog`, not `bg-[#0b1220]`.

- [ ] **Step 3: Add `theme="dark"` to QueueWidget**

In `src/components/QueueWidget.tsx`, replace the `<WidgetEmbed .../>` element:

```tsx
    <WidgetEmbed
      src={WIDGET_SRC}
      store={STORE}
      fallbackLabel="queue"
      theme="dark"
    />
```

- [ ] **Step 4: Run to verify it passes**

Run: `bun run test src/components/QueueWidget.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/QueueWidget.tsx src/components/QueueWidget.test.tsx
git commit -m "feat: render queue widget with dark theme"
```

---

### Task 3: Dark `/queue` body shell

**Files:**
- Modify: `src/app/queue/layout.tsx`

(No unit test — a server component rendering `<html>/<body>` isn't RTL-testable; covered by build + manual.)

- [ ] **Step 1: Make the body dark**

In `src/app/queue/layout.tsx`, change the `<body>` className:

```tsx
      <body className="min-h-screen bg-[#0b1220] text-cream">{children}</body>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/queue/layout.tsx
git commit -m "feat: dark body for /queue kiosk page"
```

---

### Task 4: Full verification (T3, T6)

- [ ] **Step 1: Full unit suite**

Run: `bun run test`
Expected: PASS — WidgetEmbed (storeAttr ×3 + theme ×4), ClientPortalWidget ×1,
clientportal layout ×2, proxy ×3, QueueWidget ×1. Confirms T1–T5 + storeAttr
regression (T3).

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: no errors.

- [ ] **Step 3: Production build (T6)**

Run: `bun run build`
Expected: build succeeds; `/queue`, `/checkin`, `/clientportal` all listed.

- [ ] **Step 4: Manual smoke**

Run: `bun run dev`.
- `/queue`: dark board renders, dark spinner during load, and NO full-screen
  empty gap above the board once ready (collapse works).
- `/checkin`: still light (`bg-fog`), `data-store="SS"`.
- `/clientportal`: still light, `data-account-store="SS"` (T6 — storeAttr intact).

- [ ] **Step 5: Final commit if anything changed**

```bash
git add -A
git commit -m "test: verify queue dark theme end-to-end" || echo "nothing to commit"
```

---

## Post-merge note (handled at ship/deploy, not in the worktree)

After this branch merges to `main`, the original dirty copies of the 3 files in
the **main checkout** become redundant. Revert them so the working tree matches
the merged result:

```bash
git -C /Users/theduy/Repo/SS-website checkout -- \
  src/components/WidgetEmbed.tsx src/components/QueueWidget.tsx src/app/queue/layout.tsx
```

Do NOT do this until the PR is merged (the dirty copies are the backup).

## Self-Review

- **Spec coverage:** T1→Task 1, T2→Task 1, T3→Task 1 (existing storeAttr tests) + Task 4, T4→Task 1, T5→Task 2, T6→Task 4. Reconciliation (storeAttr+theme) → Task 1 merged file. layout → Task 3. All mapped. ✅
- **Placeholders:** none — full merged file + full tests inline.
- **Type consistency:** `theme?: "light" | "dark"` identical in Task 1 (def) and Task 2 (use). `storeAttr` preserved in `setAttribute` + deps. `heightClass`/`overlayBg`/`spinnerBorder`/`errorText` names consistent. Outer wrapper = `container.firstChild` (the `relative ${heightClass}` div) used consistently in T4 tests.
- **Convention match:** mirrors the uncommitted work verbatim (same class tokens `bg-[#0b1220]`, `text-cream`, `border-mocha border-t-cream`), layered onto the storeAttr base. ✅

## Out of Scope
Untracked noise on main (`queue-after.png`, `seo-audit-output/`, `.claude/`, `tasks/todo-schema-fix.md`); queue widget bundle (third-party).
