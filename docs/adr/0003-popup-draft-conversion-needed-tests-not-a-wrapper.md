# ADR 0003 — popup-draft conversion needed tests, not a new wrapper

- Status: Accepted
- Date: 2026-07-01
- Context surfaced by: architecture review (candidate #1, "deepen the popup draft↔schema conversion into one seam")

## Context

An architecture review flagged the draft↔schema conversion in `src/lib/popup-draft.ts`
as leaking into `src/app/admin/page.tsx`, proposing a new consolidated entry point
(`submitDraft(draft): Popup`) that the admin page would call instead of `toPopup`
directly.

## Decision

**We do not add a `submitDraft` wrapper.** On inspection, `admin/page.tsx:89` already
calls `toPopup(draft)` as a single delegated call — there was no inline conversion
logic to extract. `toDraft`/`toPopup` are already the one seam between the flat form
model and `Popup` (`z.infer<typeof PopupSchema>`); a new wrapper would be a second
name for what `toPopup` already does and fails the deletion test — it moves the call
site, it doesn't concentrate anything.

The real, confirmed gap was narrower: **zero tests existed** for `popup-draft.ts`,
and the one regression in this seam (commit `b759ed6`) was a missing-conversion bug
— `startsAt`/`endsAt` passed straight through instead of bridging
`<input type="datetime-local">` and UTC ISO — that a test would have caught before
shipping.

`src/lib/popup-draft.test.ts` now covers `isoToDatetimeLocal`/`datetimeLocalToISO`
(null/invalid input, local-time interpretation, round-trip fidelity, and the
by-design seconds truncation) plus `toDraft`/`toPopup` (locale fill/trim, rich vs.
embed branches, image/cta nulling, id trimming). Zero production code changed —
this was purely a test-coverage deepening of an already-adequate seam.

Two adjacent scope questions were also resolved and are **not** part of this
decision, kept separate deliberately:

- The client-side "ID is required" check in `admin/page.tsx`, which duplicates the
  server's `z.string().min(1)`, stays as-is — same defense-in-depth pattern already
  accepted for the dark-referral system in this repo (client convenience, server is
  the real gate).
- `popup.ts` (`pickActive`/`pickText`, also pure, also untested) and
  `popups-store.ts` (a separate architecture-review candidate — it lacks an
  injectable seam for its Supabase client) were left out of this change.

## Consequences

- Future architecture reviews should not re-propose consolidating
  `toDraft`/`toPopup` into a new entry point without new evidence — e.g. the admin
  page actually starts embedding conversion logic inline (it doesn't today), or a
  second call site needs different validation behavior than the schema boundary
  provides.
- Test-coverage gaps on an already-adequate seam are a distinct finding from
  interface shallowness; treat them separately in future reviews rather than
  reaching for a structural refactor by default.
