# Spec: Clone Cleanup for Deployment

## Context

`SS-website` is a Next.js 16 site for **Sans Souci Ongles & Spa** (Laval, QC). It was built by cloning an original Squarespace site, **Blanc Nails** (`blancnailslounge.com`). The cloning process left scaffolding (reference screenshots, scraped design tokens/page maps) and stale metadata (package name, repo paths, doc titles, a code comment) that still name the original site. None of this affects the rendered site — runtime code (i18n dictionaries, `site.ts`, SEO builders, sitemap, robots) is already fully Sans Souci-branded.

**Goal:** Remove every reference to the original Blanc Nails site so the repo is clean for deployment, without touching the live site behaviour or unrelated in-flight work.

**Verified scope (full inventory):** exactly 2 directories + 9 string references. Confirmed via `grep -rin "blanc"` across repo (excluding node_modules) — no other matches exist. Source/runtime code contains zero original-brand references.

## Decisions (locked with user)

- **Git history:** Delete + commit only. Do NOT rewrite history / scrub old commits. Deployed builds never ship these files; recoverability in old commits is acceptable.
- **Package name:** `blanc-nails-clone` → `ss-website`.
- **Task docs:** Fix stale metadata (keep the docs — they're real planning).
- **README:** Rewrite generic Next.js boilerplate into a real SS project description.

## Changes

### 1. Delete clone scaffolding directories (git-tracked)
- `clone-assets/` — original-site screenshots (~2.7 MB). Not referenced by build/runtime.
- `clone-data/` — `tokens.json` + `pages.json` (contain `blancnailslounge.com` URLs) + empty `raw/`. Not imported anywhere.
- Use `git rm -r clone-assets clone-data`.

### 2. Rename package
- `package.json:2` — `"name": "blanc-nails-clone"` → `"name": "ss-website"`.
- No `description` field currently exists (do not assume one). Optional: add `"description": "Sans Souci Ongles & Spa — booking & info site"` directly after `name`.

### 3. Fix stale code comment (coupling with deleted dir)
- `src/app/manifest.ts:7` — comment references `clone-data/tokens.json` (about to be deleted). Rewrite the comment so it no longer points at the removed path; keep the meaning (theme colours match `globals.css`, not the original brown tokens). Pure comment edit — no behaviour change.

### 4. Update env example
- `env.example:8` — `e.g. "Blanc Nails <hello@yourdomain.com>"` → `e.g. "Sans Souci <hello@yourdomain.com>"`.

### 5. Fix task-doc metadata (6 files)
Replace original references; keep all doc content otherwise.
- Repo path `/Users/theduy/Repo/blanc-nails-clone` → `/Users/theduy/Repo/SS-website` in:
  - `tasks/todo-header-center-logo-mobile.md:5`
  - `tasks/todo-es-ar-copy-fixes.md:8`
  - `tasks/todo-seo-content.md:5`
  - `tasks/todo-popup-widget-system.md:5`
- Titles drop `blanc-nails-clone`:
  - `tasks/seo-audit-report.md:1` → `# Full SEO Audit — Sans Souci Ongles & Spa`
  - `tasks/seo-action-plan.md:1` → `# SEO Action Plan — Sans Souci Ongles & Spa`

### 6. Rewrite README.md
Replace Next.js boilerplate with a concise SS project README:
- One-line description: Next.js 16 multilingual (FR/EN + ES/AR) booking & info site for Sans Souci Ongles & Spa, Laval QC.
- Stack: Next.js 16, React 19, Tailwind v4, Supabase, iron-session, framer-motion, Playwright.
- Dev commands: `bun run dev`, `bun run build`, `bun run start`, `bun run lint`, `bun run test:e2e`, `bun run fetch:reviews`.
- Env setup: copy `env.example` → `.env.local`, fill values.
- Match repo's existing tone; keep it short.

## Out of Scope (do NOT touch)

- **Runtime/source code** — already SS-branded, no changes.
- **Uncommitted WIP** in working tree: `src/proxy.ts` (modified), `src/app/queue/`, `src/components/QueueWidget.tsx` (untracked). Unrelated to cleanup — leave staged/unstaged as-is, keep them OUT of the cleanup commit.
- **Git history rewrite** — explicitly excluded per decision.
- `scripts/fetch-google-reviews.mjs` — legitimate build tool, keep.
- `.playwright-mcp/`, `test-results/` — already gitignored, ignore.

## Verification

1. **No original refs remain:**
   `grep -rin "blanc" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next` → returns nothing.
2. **Dirs gone:** `ls clone-assets clone-data 2>&1` → "No such file or directory".
3. **Package valid:** `cat package.json | head -3` shows `"name": "ss-website"`; `bun install` (or lockfile no-op) still resolves.
4. **Build unaffected:** `bun run build` succeeds (proves deleted dirs were never build inputs).
5. **Lint clean:** `bun run lint`.
6. **Manifest comment:** `grep -rn "clone-data\|clone-assets" src/` → returns nothing.
7. **Commit isolation:** cleanup changes committed separately from the queue/proxy WIP. Suggested message: `chore: remove blanc-nails clone scaffolding and rename to ss-website`.
