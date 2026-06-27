# Phase 6: Dark-Referrer Recovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-26
**Phase:** 6-Dark-Referrer Recovery
**Areas discussed:** Detection signal, Logging path & write auth, Row schema / columns, Read / verify path

---

## Detection signal

| Option | Description | Selected |
|--------|-------------|----------|
| Referrer + utm_source | Match Referer host AND utm_source param against the AI host set | ✓ |
| Referrer header only | Match only the Referer header host (literal GEO-02; misses ChatGPT) | |
| utm_source only | Match only utm_source (misses Perplexity/Claude/Gemini) | |

| Option | Description | Selected |
|--------|-------------|----------|
| Suffix / subdomain-safe | Match registrable domain (www.perplexity.ai, chat.openai.com all hit) | ✓ |
| Exact host equality | Only literal bare hosts; brittle to subdomains | |

**User's choice:** Referrer + utm_source; suffix / registrable-domain match.
**Notes:** ChatGPT strips the referrer but appends `utm_source=chatgpt.com`
(research PITFALLS.md §139) — utm_source detection is mandatory to capture the
largest AI source. Host set reuses the locked Phase-03 GA4 list (first time in code).

---

## Logging path & write auth

| Option | Description | Selected |
|--------|-------------|----------|
| Forward to API route | proxy detects → non-blocking POST → Node route writes via service-role | ✓ |
| Inline in proxy.ts | proxy writes directly (fire-and-forget REST) — pulls DB logic into middleware | |

| Option | Description | Selected |
|--------|-------------|----------|
| Service-role (server-side) | Route writes with service-role key, bypasses RLS, not spammable | ✓ |
| Anon insert + RLS/GRANT | Direct client/edge write; publicly abusable | |

| Option | Description | Selected |
|--------|-------------|----------|
| Shared-secret header | proxy injects a secret header the route verifies | ✓ |
| Same-origin / header heuristic | Accept "internal-looking" requests; spoofable | |
| Leave open (rate-limit only) | Accept any POST; rows pollutable | |

**User's choice:** Forward to API route; service-role write; shared-secret header guard.
**Notes:** Write must never block the page response / 301. Internal route is not
proxy-gated (matcher excludes /api), hence the secret guard.

---

## Row schema / columns

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add ai_source label | Store normalized ai_source enum + raw host (trivial GROUP BY) | ✓ |
| No — raw host only | Derive sources in SQL each query | |

| Option | Description | Selected |
|--------|-------------|----------|
| Path only + utm_source column | Pathname without query + dedicated utm_source column (PII-free) | ✓ |
| Full path incl. query string | Keeps query, risks PII in arbitrary params | |
| Path only, drop utm_source | Bare path, loses the ChatGPT source signal | |

**User's choice:** ai_source label + path-only + dedicated utm_source column.
**Notes:** Columns = `ai_source`, `referrer_host`, `path` (no query),
`utm_source` (nullable), `created_at`. Stripping the query string keeps the row
provably PII-free (criterion 3).

---

## Read / verify path

| Option | Description | Selected |
|--------|-------------|----------|
| Code helper + test | getDarkReferrerCounts() (GROUP BY) + unit test — verifiable artifact | ✓ |
| Documented SQL only | Committed .sql run manually in Studio; test-unverified | |
| Both | Helper + test AND documented SQL | |

| Option | Description | Selected |
|--------|-------------|----------|
| Test asserts payload allowlist | Test fails if any non-allowlisted (IP/PII) field is added | ✓ |
| Manual / code-review confirmation | No automated gate; future edit could add PII silently | |

**User's choice:** Code helper + test; PII-free enforced by a payload-allowlist test.
**Notes:** The allowlist test is the load-bearing merge-gate invariant for GEO-02 criterion 3.

---

## Claude's Discretion

- Table name + id type; indexes on created_at / ai_source.
- Referrer-survival hop (bare-path 301): confirm Referer header reaches the POST trigger.
- Scheduling mechanism: Next.js 16 `after()` vs explicit fire-and-forget fetch.
- Table provisioning (SQL migration vs Studio), following the popups precedent.
- Optional `locale` column (derive from path) if cheap.
- Sampling/dedup: log every match at current traffic.

## Deferred Ideas

- Row retention / auto-pruning — out of scope (capture + minimal read).
- Admin dashboard UI of counts — beyond minimal read path.
- Sampling under high load — not needed at current salon traffic.
