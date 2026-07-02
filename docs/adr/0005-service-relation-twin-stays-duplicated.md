# ADR 0005 — The guide/comparison service-relation stays a per-lib filter, not a shared factory

- Status: Accepted
- Date: 2026-07-01
- Context surfaced by: architecture review (candidate #4, "a service-relation registry for guides & comparisons")

## Context

`src/lib/guides.ts` and `src/lib/comparisons.ts` are structural twins. Beyond the
slug mechanics they already delegate to the shared **slug registry**
(`slugRegistry(...)`), each also declares:

- the same entity shape `{ id, slug: Record<Locale, string>, service: ServiceId }`, and
- the same relation filter — `guidesForService(id) = guides.filter((g) => g.service === id)`
  and `comparisonsForService(id) = comparisons.filter((c) => c.service === id)`.

An architecture review proposed collapsing that duplication into a shared helper
(a `filterByService<T extends { service: ServiceId }>(items, id)`, or a
`serviceRelatedContentType(...)` factory beside `slugRegistry`), so each lib
would be data plus one call.

## Decision

**We do not extract a shared service-relation helper or factory.** The relation
is a one-line `filter` in two libs; a shared abstraction moves complexity rather
than concentrating it, and it cuts against a decision `CONTEXT.md` already
records.

- **Deletion test.** Deleting `guidesForService` and inlining its filter costs
  nothing and re-duplicates nothing meaningful — the "rule" is `x.service === id`,
  three lines, stated in exactly two places. A `filterByService<T>` helper
  concentrates those ~3 lines × 2 behind a generic type signature; the signature
  is as much surface as the code it removes. It **moves**, it doesn't concentrate.
  It fails the test.

- **It contradicts the domain model on purpose.** `CONTEXT.md` (Seams §
  Slug registry) deliberately keeps `*ForService` **out** of the registry: *"a
  relation between content types, not a slug concern … only two of three types
  have it. It stays a one-line filter in its own lib."* The slug registry earns
  its keep because the slug mechanics (`slugParams`/`bySlug`/`path`/`pathsByLocale`)
  are deep and shared by all three content types. The service relation is neither
  deep nor universal — only guides and comparisons have it; services *are* the
  target.

- **Two is not yet a real seam.** The repo's own rule: one adapter is a
  hypothetical seam, two is a real one. Two near-identical filters is the minimum
  that *could* justify a factory, but only if the shape were volatile or growing.
  It is neither: `{ id, slug, service }` is stable, and the filter is a stdlib
  one-liner.

## Consequences

- `guides.ts` and `comparisons.ts` keep their own `{ id, slug, service }` type and
  their own `*ForService` filter. The structural similarity is accepted as the
  cost of two small, independently readable libs — not refactored into a generic.

- Future architecture reviews should not re-propose a shared service-relation
  helper/factory without new evidence — specifically, a **third** content type
  that relates to a service (making the pattern 3-of-N, where a factory would
  genuinely concentrate the shape and the filter), or the relation growing beyond
  a single-field equality (e.g. many-to-many, weighting, ordering) such that the
  logic — not just the shape — is worth owning once.
