<!-- s1 metadata
task-name: es-ar-copy-fixes
scope: small
status: done
branch: fix/es-ar-copy
commit: 3cdd78c
result: AR 5 fixes applied + committed; ES audited, no edit; build green; e2e 51 pass (1 flake confirmed serial-pass); lint 3 pre-existing errors unrelated to JSON.
repo: /Users/theduy/Repo/blanc-nails-clone
created-at: 2026-05-21
note: Originated from "/s1-plan reviews + ES/AR". Reviews track DEFERRED by user
      decision (real Google reviews + verified:true still required before launch —
      see memory reviews-schema-gated-on-verified). This plan covers ES/AR copy only.
-->

# ES/AR Dictionary Copy Fixes Implementation Plan

> **For agentic workers:** Small scope — implement directly with verification discipline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Arabic dictionary's gender/register inconsistencies so the whole site addresses the female clientele consistently; confirm the Spanish dictionary is launch-clean.

**Architecture:** Pure copy edits to two JSON locale files. No code, no schema, no components change. The site already renders these strings; fixes are word-level. Verification = JSON validity + key parity (no dropped keys) + production build + existing Playwright E2E suite green.

**Tech Stack:** Next.js (App Router) i18n via static JSON dictionaries (`src/dictionaries/{en,fr,es,ar}.json`), Playwright E2E.

**Audit basis:** FR is source-of-truth (default locale). All 4 dicts already at 142 keys, parity verified. AR uses feminine address (`ـكِ`, `احجزي`, `اكتشفي`) throughout — appropriate for a nail salon's female clientele — with a few unmarked/masculine outliers. ES is fluent neutral `tú` Spanish with correct `4,9` decimal comma; no errors found.

---

## File Structure

- Modify: `src/dictionaries/ar.json` — 5 word-level fixes across 4 lines (gender consistency)
- Audit only: `src/dictionaries/es.json` — confirm clean, no edit expected
- Reference: `src/dictionaries/fr.json` (source of truth), `src/dictionaries/en.json`

---

## Task 1: Fix Arabic gender/register inconsistencies

**Files:**
- Modify: `src/dictionaries/ar.json`

The AR dictionary addresses a female reader everywhere (`رضاكِ`, `يديكِ`, `أظافركِ`, `لكِ`). Five spots break that voice — one masculine imperative and four FAQ strings that drop the feminine kasra. Fix all five to match the established voice.

- [ ] **Step 1: Fix the masculine CTA label (`cta.callNow`, line 32)**

Current:
```json
    "callNow": "اتصل بنا",
```
Change to (feminine, matching `nav.contact`, `home.contactHeading`, `contact.heading`):
```json
    "callNow": "اتصلي بنا",
```

- [ ] **Step 2: Add feminine kasra in `faq.intro` (line 306)**

Current fragment: `...كل ما تحتاجين معرفته قبل زيارتك لـ Sans Souci...`
Change `زيارتك` → `زيارتكِ` (the verb `تحتاجين` is already feminine; the noun must match).

- [ ] **Step 3: Add feminine kasra in `faq.items[1].a` (line 309)**

Current fragment: `...لكن الحجز المسبق يضمن وقتك وفنيّتك — خاصةً...`
Change `وقتك وفنيّتك` → `وقتكِ وفنيّتكِ`.

- [ ] **Step 4: Add feminine kasra in `faq.items[6].a` (line 314)**

Current fragment: `فريقنا يخدمك بالفرنسية والإنجليزية...`
Change `يخدمك` → `يخدمكِ`.

- [ ] **Step 5: Add feminine kasra in `faq.items[8].a` (line 316)**

Current fragment: `...سنشارككِ نصائح العناية خلال زيارتك.`
Change `زيارتك` → `زيارتكِ` (note `سنشارككِ` in the same string is already marked — this removes the intra-sentence inconsistency).

- [ ] **Step 6: Verify JSON still parses and key parity holds**

Run:
```bash
node -e "require('./src/dictionaries/ar.json'); console.log('ar.json valid')"
node -e "const k=o=>{const a=[];(function w(p,x){for(const n in x){const q=p?p+'.'+n:n;typeof x[n]==='object'&&x[n]!==null&&!Array.isArray(x[n])?w(q,x[n]):a.push(q)}})('',o);return a.sort()};const fr=k(require('./src/dictionaries/fr.json')),ar=k(require('./src/dictionaries/ar.json'));console.log('parity:',JSON.stringify(fr)===JSON.stringify(ar)?'OK 142/142':'MISMATCH')"
```
Expected: `ar.json valid` then `parity: OK 142/142`

- [ ] **Step 7: Confirm no other unmarked 2nd-person-feminine remains in AR**

Run (lists any bare `ك` end-of-word 2nd-person that may need a kasra — review hits manually; imperatives like `راجعي`/`اسألي` and `نا`/`كِ` endings are already correct):
```bash
grep -nE 'وقتك|زيارتك|يخدمك|اتصل بنا' src/dictionaries/ar.json
```
Expected: no remaining matches for `اتصل بنا`, `وقتك ` (unmarked), `زيارتك` (unmarked), `يخدمك` (unmarked) — only the marked `ـكِ` forms.

- [ ] **Step 8: Commit**

```bash
git add src/dictionaries/ar.json
git commit -m "fix: consistent feminine address in Arabic dictionary

callNow CTA and four FAQ strings used masculine/unmarked forms while the
rest of the site addresses the female clientele. Align them."
```

---

## Task 2: Audit Spanish dictionary, confirm launch-clean

**Files:**
- Audit: `src/dictionaries/es.json` (edit only if a real error surfaces)

ES was reviewed in full during planning: fluent neutral `tú` register, consistent feminine `clientas`, correct `4,9` / `4,9★` decimal comma, complete key set. The only non-error observation is a stylistic thousands-separator mix — meta strings use compact `1000+` (`meta.homeDescription`, service `metaDescription`s) while body copy uses `1 000` with a thin space. This is intentional density in meta tags, not an error. **Per surgical-change discipline, leave as-is.**

- [ ] **Step 1: Re-confirm ES validity and parity (no accidental drift)**

Run:
```bash
node -e "require('./src/dictionaries/es.json'); console.log('es.json valid')"
node -e "const k=o=>{const a=[];(function w(p,x){for(const n in x){const q=p?p+'.'+n:n;typeof x[n]==='object'&&x[n]!==null&&!Array.isArray(x[n])?w(q,x[n]):a.push(q)}})('',o);return a.sort()};const fr=k(require('./src/dictionaries/fr.json')),es=k(require('./src/dictionaries/es.json'));console.log('parity:',JSON.stringify(fr)===JSON.stringify(es)?'OK 142/142':'MISMATCH')"
```
Expected: `es.json valid` then `parity: OK 142/142`

- [ ] **Step 2: No commit** — no ES edit expected. If review during execution finds a genuine error, fix it in a separate `fix:` commit and note it here.

---

## Task 3: Full verification gate

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run: `bun run lint`
Expected: no new errors.

- [ ] **Step 2: Production build**

Run: `bun run build`
Expected: build succeeds (all `[lang]` routes prerender for `ar` and `es` without error).

- [ ] **Step 3: E2E suite**

Run: `bun run test:e2e`
Expected: all specs green (i18n, content-render, navigation, seo, homepage, contact-form, popup).

- [ ] **Step 4: Manual render confirmation (Arabic CTA)**

Start dev (`bun run dev`), open `/ar`, confirm the Call CTA button reads `اتصلي بنا` (feminine) and renders RTL. Spot-check `/ar/faq` for the four corrected strings.

---

## Self-Review

- **Spec coverage:** Task name = "reviews + ES/AR". Reviews → deferred (documented in metadata + memory). ES → audited clean (Task 2). AR → 5 fixes (Task 1). Verification gate (Task 3). Covered.
- **Placeholder scan:** None — every edit shows exact before/after Arabic text and exact line.
- **Consistency:** All AR fixes converge on one rule (feminine `ـكِ` / feminine imperative), matching the site's existing dominant voice. No conflicting conventions introduced.
- **Out of scope (flag for human/native pass):** This is an obvious-error sweep, not native certification. A native Arabic speaker should still confirm tone/naturalness before launch; likewise a native Spanish speaker for ES. Reviews data remains the hard launch blocker.
