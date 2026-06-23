# Phase 05: Agent-Readable Surface (`.md` twins) - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a clean-text, machine-readable `.md` twin for every `[lang]` content
route, derived from the **same JSON dictionary source** as the HTML page (no
drift), indexed from `/llms.txt`, registered in `STANDALONE_PATHS`
(`src/proxy.ts`) with a `proxy.test.ts` passthrough assertion (the v1
merge-gate invariant). Requirement: **EXP-03**.

Extends the v1 `/llms.txt` force-static pattern. Net-new is: a `.md` route
generator + proxy/test wiring + an `/llms.txt` `.md` index section.

**Not in this phase:** new content/pages (Phase 04 shipped those), dark-referrer
logging (Phase 06), schema changes, CSP.
</domain>

<decisions>
## Implementation Decisions

### Route coverage
- **D-01:** `.md` twins cover **all content routes** — every `[lang]` route:
  home (`/`), services (index) + each `services/[slug]`, about, appointments,
  contact, gallery, reviews, faq, terms, privacy, laval, each
  `comparisons/[slug]` (×6), each `guides/[slug]` (×3) — in all 4 locales
  (en/fr/es/ar). This is the literal reading of EXP-03 ("all content routes").
- **D-02:** Coverage parity is enforced against the **canonical route source**
  (the same registries/`site.ts` nav the `sitemap.ts` enumerates). The `.md`
  generator and the sitemap must derive their route list from one source so a
  new route can never get a sitemap entry without a `.md` twin (and vice versa).

### Content shape
- **D-03:** Each `.md` twin is a **full-page text mirror** — the full page body
  rendered to markdown, all sections, headings preserved (not an answer-first
  condensed extract).
- **D-04:** Thin/transactional pages (appointments = SalonX booking iframe,
  gallery = images) have little body text to mirror. For these, the `.md`
  mirrors whatever dictionary copy exists (heading + intro/blurb) and **links
  out** to the live booking/gallery rather than attempting to mirror an iframe
  or image grid. Planner to confirm per-route.

### Frontmatter
- **D-05:** Each `.md` opens with **minimal YAML frontmatter**: `title`, `lang`,
  `canonical` (the HTML page URL), `updated` (last-modified date). Body follows.
  Frontmatter helps crawlers pair `.md` ↔ HTML and identify the locale.

### llms.txt index
- **D-06:** `/llms.txt` lists the **EN `.md` twins only**, keeping the existing
  one-line "FR/ES/AR variants exist at /fr/, /es/, /ar/" convention. Do not list
  all 4 locales per route (avoids 4× bloat; crawlers derive locale variants from
  the path + existing note).

### Claude's Discretion (planner/researcher decide)
- **Proxy registration mechanism:** enumerate every `/{locale}/<path>.md` in the
  `STANDALONE_PATHS` Set vs. add a `.md`-suffix guard to the standalone
  passthrough check. Both satisfy EXP-03 ("registered in src/proxy.ts with a
  proxy.test.ts passthrough assertion"). Note: `.md` twins are locale-prefixed
  so they already pass the proxy's `hasLocale` check — registration is the
  belt-and-suspenders merge-gate invariant, not a functional requirement.
- **Route factory shape:** Next.js App Router `.md` handler — single catch-all
  vs. a shared route-handler factory + `generateStaticParams`. Must be
  `force-static` (mirror `llms.txt/route.ts`).
- **`.md` serializer:** how to render a full-page mirror from the dictionary
  source without drift. KEY RESEARCH ITEM — page bodies are component-composed
  (not pure dict text); the researcher must find/define a shared content model
  so the `.md` and the HTML page read from one source. If full parity is
  infeasible for component-heavy pages, surface the tradeoff before planning.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 05 section: success criteria + 1–2 plan sketch
  (route-handler factory → STANDALONE_PATHS/proxy.test wiring → llms.txt index).
- `.planning/REQUIREMENTS.md` — EXP-03 full text + milestone success criterion 2
  (`curl <route>.md` → HTTP 200 clean text, every route, linked from llms.txt).

### Pattern to extend (v1 precedent)
- `src/app/llms.txt/route.ts` — force-static route handler
  (`export const dynamic = "force-static"`), EN-only listing convention, sources
  content from registries + `site.ts`. The `.md` routes mirror this shape; its
  Key Pages / Comparisons / Guides sections gain a `.md` index.
- `src/proxy.ts` — `STANDALONE_PATHS` exact-match Set (`/llms.txt` already in
  it); the standalone passthrough branch (`1b`). Registration target for EXP-03.
- `src/proxy.test.ts` — passthrough-assertion pattern; add `.md` route
  assertions here (merge-gate invariant).

### Route + content source (no-drift)
- `src/app/sitemap.ts` — canonical route enumeration (nav, services,
  comparisons, guides, secondaryNav, local). The `.md` generator should derive
  its route list from the SAME source for coverage parity (D-02).
- `src/lib/site.ts` — `nav` + `secondaryNav` route arrays (home, services,
  about, appointments, contact, gallery, reviews, faq, terms, privacy).
- `src/lib/services.ts`, `src/lib/comparisons.ts`, `src/lib/guides.ts` —
  registries + `servicePath` / `comparisonPath` / `guidePath` per-locale helpers.
- `src/lib/dictionary.ts` + `src/dictionaries/{en,fr,es,ar}.json` — the
  dictionary content source (`.md` must derive from these — no second copy).
- `src/app/[lang]/dictionaries.ts` — locale dictionary loader.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `llms.txt/route.ts`: copy its `force-static` route-handler shape + the
  label-record-keyed-by-registry-id pattern (missing label fails at type-check).
- `servicePath` / `comparisonPath` / `guidePath`: per-locale path builders —
  reuse to generate `.md` URLs identical to the HTML routes.
- `dictionary.ts` / `dictionaries.ts`: typed dict loader (`Dictionary = typeof
  en`) — the single content source for the `.md` serializer.

### Established Patterns
- Route handler in a folder named with a literal extension
  (`app/llms.txt/route.ts`) — the `.md` factory likely follows the same idiom
  under `app/[lang]/...`.
- `STANDALONE_PATHS` is a flat exact-match `Set<string>` checked in proxy step
  `1b`; the merge gate is `proxy.test.ts` ([[standalone-route-proxy-coupling]]:
  un-registered standalone routes 404 and the build won't catch it).
- `sitemap.ts` is the existing whole-route enumerator — treat it as the parity
  reference for "all content routes".

### Integration Points
- `src/proxy.ts` `STANDALONE_PATHS` + `src/proxy.test.ts` assertion.
- `src/app/llms.txt/route.ts` body — add a `.md` index section (EN-only).
- `sitemap.ts` route source — single source of truth for the route list.

</code_context>

<specifics>
## Specific Ideas

- The `.md` twin must serve **HTTP 200 clean text** to `curl` (success criterion
  2). Content-Type `text/markdown; charset=utf-8` (or `text/plain`) — planner to
  pick; `llms.txt` uses `text/plain`.
- "No drift" is the load-bearing constraint: a single dictionary-derived content
  model feeds both the HTML render and the `.md` serializer. The full-page-mirror
  decision (D-03) raises the bar here — flag infeasible pages before planning.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Dark-referrer logging = Phase 06;
SpeakableSpecification = v2.0 backlog per REQUIREMENTS.md.)

</deferred>

---

*Phase: 05-Agent-Readable Surface (`.md` twins)*
*Context gathered: 2026-06-23*
