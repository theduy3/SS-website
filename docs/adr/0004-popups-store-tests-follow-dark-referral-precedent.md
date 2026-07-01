# ADR 0004 — popups-store needed tests via the existing degrade branch, not an injectable client seam

- Status: Accepted
- Date: 2026-07-01
- Context surfaced by: architecture review (candidate #3, "popups-store lacks an injectable seam for its Supabase client")

## Context

An architecture review flagged `src/lib/popups-store.ts` as untestable because
`listPopups`/`upsertPopup`/`deletePopup`/`uploadPopupImage`/`readPopups` all call
`getSupabaseAdmin()`/`getSupabasePublic()` internally rather than accepting a
client as a parameter, proposing a ports-and-adapters seam (real client in prod,
fake client in tests).

## Decision

**We do not add an injectable client parameter.** This codebase already has an
established, working precedent for testing Supabase-touching code —
`src/lib/dark-referral.ts` / `dark-referral.test.ts` — and it does not use client
injection:

- Pure logic is extracted and tested directly with no Supabase import at all
  (`detectAiReferral`, `buildInsertPayload`).
- The one function that does touch Supabase, `getDarkReferrerCounts()`
  (`src/lib/supabase.ts`), is tested via its graceful-degrade branch: the test
  environment has no `SUPABASE_*` env vars, so `getSupabaseAdmin()` naturally
  returns `null` and the function's `null` return is asserted — no mock, no
  injected fake client.

`popups-store.ts` already has the identically-shaped seam: `parseRows` is
already pure and already separated from the Supabase calls, and every function
already has a `not_configured` branch (`StoreResult<T>` with
`reason: "not_configured"`, or plain `null` for `readPopups`) for exactly this
scenario. Adding a client parameter on top would introduce a testing pattern
that exists nowhere else in this codebase (Rule: match existing conventions) to
solve a problem the existing pattern already solves.

The fix: export `parseRows` (was module-private) and add
`popups-store.test.ts` covering (1) `parseRows` dropping schema-invalid rows
and keeping valid ones, and (2) the `not_configured`/`null` branch for all five
functions — using `// @vitest-environment node`, the same override
`dark-referral.test.ts` uses, since `getSupabaseAdmin`'s browser guard
(`typeof window !== "undefined"`) would otherwise throw under this project's
default jsdom environment.

## Consequences

- Future architecture reviews should not re-propose an injectable-client seam
  for Supabase-touching modules in this codebase without new evidence — e.g. a
  need to test actual query behavior (not just the unconfigured branch), which
  the current pattern genuinely cannot cover.
- New Supabase-touching modules should follow the same shape: separate pure
  logic where possible, keep a `not_configured`/`null` degrade branch, test
  that branch under `@vitest-environment node`.
