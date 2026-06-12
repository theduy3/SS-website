# Spec: Land queue dark-theme work + reconcile with merged `storeAttr`

**Status:** spec
**Date:** 2026-06-12
**Author:** theduy + Claude

## Problem

A complete, visually-verified (`queue-after.png`) dark-theme feature for the
`/queue` kiosk sits **uncommitted** in the `main` working tree across 3 files. It
was written before the `/clientportal` PR (`2573d5b`) added a `storeAttr` prop to
the **same** `WidgetEmbed.tsx`. The result:

- Local `main` diverged: 2 doc-commits ahead, 1 behind `origin/main`, working tree
  dirty on `WidgetEmbed.tsx`, `QueueWidget.tsx`, `queue/layout.tsx`.
- `git pull` would **abort** — `local changes to WidgetEmbed.tsx would be
  overwritten by merge`.

Goal: land the dark-theme work cleanly on top of the merged `storeAttr`, with
unit tests (vitest now exists) and a live re-verify. **No redesign** — the feature
is final.

## The uncommitted work (final, do not redesign)

### `src/app/queue/layout.tsx`
Body className `bg-fog text-espresso` → `bg-[#0b1220] text-cream` (dark kiosk shell).

### `src/components/QueueWidget.tsx`
`<WidgetEmbed …>` gains `theme="dark"`.

### `src/components/WidgetEmbed.tsx` (theme additions)
- New prop `theme?: "light" | "dark"` (default `"light"`).
- Dark overlay tokens: `overlayBg = bg-[#0b1220]`, `spinnerBorder =
  border-mocha border-t-cream`, `errorText = text-fog` (light keeps `bg-fog`,
  `border-tan border-t-espresso`, `text-mocha`).
- Collapse-height: `fullHeight = !dark || status !== "ready"`; `heightClass =
  fullHeight ? "min-h-screen" : ""`. Container + ref div use `heightClass`.
- Overlay blocks use the themed tokens.
- Updated lead comment explaining the queue widget's `<body>` mount.

**Premise verified:** `technician-queue-widget.js` does `document.body` + appends
`#salonx-queue-widget` to `<body>` (not in-place like check-in). So once the dark
board is ready, collapsing our container to `0` height prevents a full-viewport
empty gap above the board. The collapse logic is correct.

## Reconciliation (the only real decision)

`storeAttr` (merged) and `theme` (uncommitted) are **orthogonal** edits to
`WidgetEmbed.tsx`:
- `storeAttr` → which `data-*` attribute the injected script carries
  (`setAttribute(storeAttr, store)`, deps include `storeAttr`).
- `theme` → overlay colors + container height. Touches no attribute logic.

They only **co-locate** in the props destructure, the props type block, and the
lead comment. No semantic conflict — the merged file simply carries both prop
blocks.

**Chosen approach (A):** fresh worktree off `origin/main` (which has `storeAttr`).
Re-apply the dark-theme changes there:
- `queue/layout.tsx` and `QueueWidget.tsx` apply **verbatim** (they don't touch
  `storeAttr`).
- `WidgetEmbed.tsx` is produced by layering the theme additions onto the
  `origin/main` `storeAttr` base (not the stale local base).

The dirty `main` working tree is **left untouched** until the PR merges — it is
the backup copy of the work. Rejected: stash/pull/pop (surgery in dirty main) and
commit-then-rebase (carries the stale base, manual conflict resolve).

### Merged `WidgetEmbed` contract
```
export function WidgetEmbed({
  src,
  store,
  storeAttr = "data-store",   // from merged storeAttr work
  fallbackLabel,
  theme = "light",            // from dark-theme work
}: {
  src: string;
  store: string;
  storeAttr?: string;
  fallbackLabel: string;
  theme?: "light" | "dark";
})
```
- `script.setAttribute(storeAttr, store)` (storeAttr behavior preserved)
- deps: `[src, store, storeAttr, attempt]` (storeAttr stays in deps; theme is
  derived render state, not an effect input)
- theme color tokens + `heightClass` collapse + themed overlay render

## Must-Haves (truth contract)

- **T1** — `theme="dark"`: the loading overlay uses `bg-[#0b1220]` and the dark
  spinner border (`border-mocha border-t-cream`).
- **T2** — default (no `theme`): the loading overlay uses `bg-fog` and the light
  spinner (`border-tan border-t-espresso`). (Regression.)
- **T3** — `storeAttr` still works alongside `theme`: omitting `storeAttr` injects
  `data-store`; `storeAttr="data-account-store"` injects that and not `data-store`.
  (Regression of the merged behavior.)
- **T4** — dark + script `onload` fired (`status="ready"`): the container loses
  `min-h-screen` (collapses). Light + ready keeps `min-h-screen`.
- **T5** — `QueueWidget` renders the dark overlay (the `theme="dark"` prop is
  actually wired through, not dropped).
- **T6** — `git pull`/integration is clean: the shipped `WidgetEmbed.tsx` contains
  BOTH `storeAttr` and `theme`; `/checkin` and `/clientportal` remain light.

## Testing

- **Unit — `WidgetEmbed.test.tsx`** (extend existing file):
  - T1: render `theme="dark"`, assert the `role="status"` overlay's parent (or the
    overlay div) carries `bg-[#0b1220]` and the spinner carries the dark border
    classes.
  - T2: render default, assert `bg-fog` + light spinner. (Already partially covered
    by the existing loading-overlay test; extend it.)
  - T4: render `theme="dark"`, grab the injected `<script>`, fire `script.onload`,
    flush, assert the container `div` no longer has `min-h-screen`. Render light +
    onload, assert it still has `min-h-screen`.
  - T3: already covered by the existing storeAttr tests — confirm they still pass
    with the merged file.
- **Unit — `QueueWidget.test.tsx`** (new): render `<QueueWidget />`, assert the
  dark overlay (`bg-[#0b1220]`) is present → proves `theme="dark"` is wired (T5).
- **Manual:** `bun run dev`, open `/queue` → dark board, dark spinner, NO empty
  gap above the board once ready (collapse works). `/checkin` + `/clientportal`
  still light. `bun run build` green.

## Out of scope

- Untracked noise on `main` (`queue-after.png`, `seo-audit-output/`, `.claude/`,
  `tasks/todo-schema-fix.md`) — not part of this feature. Flag for a separate
  cleanup pass; do not commit them here.
- The `queue/layout.tsx` body-className change has no clean unit test (server
  component rendering `<html>/<body>`); covered by build + manual only.
- Any change to the queue widget bundle (third-party).

## Risks

- If the merged `WidgetEmbed` accidentally drops `storeAttr` from the deps array or
  the `setAttribute` call during the layering, `/clientportal` silently breaks. T3
  + T6 guard this.
- The dirty `main` working tree must be preserved until merge; only after the PR
  lands should those 3 files be reverted (`git checkout`) to match.
