# Phase 6: Dark-Referrer Recovery - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Edge middleware (`src/proxy.ts`) detects AI-referred page requests and logs
them — **host + path + timestamp only, no IP / no PII / no cookie** — to the
existing self-hosted Supabase. This captures the pre-consent "dark" AI sessions
GA4's Consent-Mode gate drops. Because no personal data is stored, logging sits
**outside** the Law 25 consent gate as aggregate analytics. A minimal read path
returns aggregate dark-referrer counts by host. Requirement: **GEO-02**.

Extends two existing assets: the v1 AI-referrer host set (previously a GA4
channel-group regex only — see D-03) and the `src/lib/supabase.ts` dual-client
write pattern.

**Not in this phase:** GA4 / consent changes (Phase 03 shipped those), content
or `.md` twins (Phases 04/05), per-visitor identity/IP, row retention/pruning,
an admin dashboard UI, sampling. Capture + minimal aggregate read only.
</domain>

<decisions>
## Implementation Decisions

### Detection
- **D-01:** Detection signal = **Referer header host AND the `utm_source=`
  query param**, either matching the AI host set fires a log. Rationale:
  ChatGPT frequently sends **no referrer** but appends `utm_source=chatgpt.com`
  (research PITFALLS.md §139, behaviour since June 2025) — a referrer-only gate
  would miss the single largest AI source, defeating the recovery goal.
- **D-02:** Host match = **suffix / registrable-domain** (subdomain-safe), so
  `www.perplexity.ai`, `chat.openai.com`, `gemini.google.com` all match. Exact
  host equality is rejected as brittle.
- **D-03:** The AI host set is the **v1 list locked in Phase 03 D-03**:
  `chatgpt.com, perplexity.ai, claude.ai, gemini.google.com,
  copilot.microsoft.com, openai.com` (research PITFALLS.md §136). NOTE: this set
  has **never existed in code** — Phase 03 explicitly declined code-side
  referrer tagging and used a GA4 admin regex only. This phase defines it in
  code (a single shared constant) for the first time. "Reuses the v1 host set"
  (GEO-02) = reuse this exact list, not an existing module.

### Logging path & write auth
- **D-04:** `proxy.ts` detects the AI referral, then fires a **non-blocking
  POST to an internal Node API route** that performs the write. Keeps the
  Supabase SDK + service-role client out of the proxy bundle; the write must
  never block or delay the page response / 301 redirect.
- **D-05:** The write authenticates with the **service-role key, server-side**
  (`getSupabaseAdmin()`), bypassing RLS. Avoids the self-hosted anon-GRANT
  gotcha and is not publicly spammable. Anon-insert + RLS/GRANT was rejected
  (the insert endpoint would be publicly abusable).
- **D-06:** The internal log route is **guarded by a shared-secret header**
  that `proxy.ts` injects from an env var and the route verifies before
  writing (reject otherwise). The route is publicly reachable (proxy's matcher
  excludes `/api`), so this prevents external POSTs forging rows.

### Row schema (PII-free)
- **D-07:** Columns: **`ai_source`** (normalized label, e.g. `chatgpt` /
  `perplexity` — collapses subdomains for trivial GROUP BY), **`referrer_host`**
  (raw matched host), **`path`** (pathname **only, query string stripped**),
  **`utm_source`** (the matched value, nullable), **`created_at`** (timestamp).
  No IP, no cookie, no full query string, no PII. Stripping the query string is
  load-bearing: arbitrary params can carry PII; `utm_source` is the one signal
  promoted to its own column.

### Read / verify
- **D-08:** Read path = a **code helper `getDarkReferrerCounts()`** (aggregate
  GROUP BY `ai_source` / host) **+ a unit test** — a verifiable, committed
  artifact matching the project's test-gate discipline; callable later from an
  admin view if ever wanted. (Plain documented SQL was rejected as
  test-unverified.)
- **D-09:** The "row schema is PII-free" guarantee is enforced by a **test
  asserting the logged insert payload contains ONLY the allowlisted fields**
  `{ai_source, referrer_host, path, utm_source, created_at}` — fails if any
  IP/cookie/PII column is ever added. This is the load-bearing merge-gate
  invariant for GEO-02 success criterion 3 (same spirit as the `proxy.test.ts`
  passthrough gate).

### Claude's Discretion (planner / researcher decide)
- **Table name + id**: e.g. `dark_referrals`; id column type (bigint identity
  vs uuid); index on `created_at` and/or `ai_source` for the aggregate read.
- **Referrer-survival hop**: the AI referrer rides the **first (bare-path)
  request**, which `proxy.ts` 301-redirects to add the locale. Researcher to
  confirm `request.headers.get('referer')` is available at the hop where
  detection/POST is triggered, and that the redirect doesn't drop it.
- **Scheduling mechanism**: Next.js 16 `after()` to run the POST after the
  response, vs an explicit fire-and-forget `fetch()` in proxy. Either satisfies
  D-04 (non-blocking, forward-to-route).
- **Table provisioning**: SQL migration file vs Supabase Studio, following
  however the existing `popups` table was provisioned.
- **Locale capture**: optional `locale` column derivable from path — not
  required by GEO-02; include only if cheap.
- **Sampling/dedup**: at current salon traffic, log every match (no sampling)
  unless the researcher surfaces a load concern.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 06 section: success criteria + 1–2 plan sketch
  (Supabase table + RLS/grant; middleware logger + host-match + read path).
- `.planning/REQUIREMENTS.md` — **GEO-02** full text + milestone success
  criterion 3 (AI-referred request → Supabase row with host+path+timestamp and
  **no** IP/PII/cookie; a query returns aggregate counts; bypasses consent gate
  by design).

### Detection host set (the "v1 set" GEO-02 reuses)
- `.planning/research/PITFALLS.md` §136 — the AI host regex
  (`chatgpt\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|openai\.com`)
  this phase's host set is sourced from. §139 — ChatGPT appends
  `utm_source=chatgpt.com` (the reason D-01 mandates utm_source detection).
- `.planning/milestones/v1.0-phases/03-measurement-conversion/03-CONTEXT.md` —
  Phase 03 **D-03**: AI-referrer capture was GA4 channel-group regex ONLY, no
  code-side tagging. Confirms this phase introduces the host set in code.

### Code to extend / integrate
- `src/proxy.ts` — Next.js 16 middleware (single proxy file). `matcher`
  excludes `/api`, `_next`, and dotted paths; the locale-redirect (301) hop is
  where the AI Referer header arrives; `STANDALONE_PATHS` exact-match pattern.
  Detection + non-blocking POST live here.
- `src/lib/supabase.ts` — `getSupabaseAdmin()` (service-role, server-only),
  `getSupabasePublic()`, `POPUPS_TABLE` const pattern. Add the dark-referrals
  table const + reuse the admin client for the write.
- `src/app/api/contact/route.ts` — model the internal log route on this Node
  route-handler shape (env-guarded, graceful degrade when config missing).
- `src/proxy.test.ts` — existing merge-gate test pattern; add the detection /
  PII-allowlist assertions here or in a sibling test.
- `.planning/codebase/INTEGRATIONS.md` — self-hosted Supabase host/env-var
  conventions (`SUPABASE_SERVICE_ROLE_KEY`), Dokploy deploy (env injection).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getSupabaseAdmin()` (`src/lib/supabase.ts`): service-role write client,
  server-only, returns `null` when env missing (graceful degrade). The write
  path reuses this directly.
- `POPUPS_TABLE` const pattern: add a `DARK_REFERRALS` table const beside it.
- `src/app/api/contact/route.ts`: env-guarded Node API route handler — template
  for the internal log endpoint (returns 503/no-op when unconfigured).

### Established Patterns
- **Dual-client graceful degrade**: every Supabase feature no-ops cleanly when
  env is absent (build/dev/e2e fall back). The logger must follow this — no
  config → silently skip logging, never crash a page render.
- **Proxy matcher** excludes `/api` + dotted paths, so the internal POST route
  is NOT proxy-gated (hence the shared-secret guard, D-06).
- **Merge-gate test discipline** (`proxy.test.ts` passthrough, `md-coverage`
  parity): D-09's PII-allowlist test is the equivalent invariant here.
- **Self-hosted anon-GRANT gotcha** ([[supabase-anon-grant-gotcha]]): RLS policy
  alone fails for anon on self-hosted; service-role (D-05) sidesteps it entirely.

### Integration Points
- `src/proxy.ts` — detection + injected-secret POST.
- New internal Node API route (e.g. `src/app/api/<name>/route.ts`) — verifies
  secret, writes via service-role.
- `src/lib/supabase.ts` — table const + write helper; `getDarkReferrerCounts()`
  read helper (D-08).
- New test file / `proxy.test.ts` — detection + PII-allowlist gates.
- Dokploy env — new shared-secret var; reuse existing `SUPABASE_SERVICE_ROLE_KEY`.
</code_context>

<specifics>
## Specific Ideas

- **Non-blocking is load-bearing** — the write must never delay the page
  response or the locale 301. Fire-and-forget / `after()`.
- **The referrer rides the FIRST request** (bare path) that proxy 301-redirects
  to add locale. Detection reads `request.headers.get('referer')` at that hop;
  researcher must confirm the header survives to where the POST fires.
- **`utm_source=chatgpt.com` is often the ONLY signal** (ChatGPT strips the
  referrer) — this is why D-01 makes utm_source detection mandatory, not
  optional.
- **New env vars on Dokploy**: a shared secret for the internal endpoint; the
  write reuses the existing `SUPABASE_SERVICE_ROLE_KEY`.
</specifics>

<deferred>
## Deferred Ideas

- **Row retention / auto-pruning** of old dark-referrer rows — out of scope for
  GEO-02 (capture + minimal read). Backlog if the table grows.
- **Admin dashboard / UI view** of counts — beyond "minimal read path"; the
  `getDarkReferrerCounts()` helper (D-08) is callable later if this is built.
- **Sampling under high load** — not needed at current salon traffic.

(All three were raised at the wrap-up gate and consciously left out of this
phase's minimal scope.)
</deferred>

---

*Phase: 6-Dark-Referrer Recovery*
*Context gathered: 2026-06-26*
