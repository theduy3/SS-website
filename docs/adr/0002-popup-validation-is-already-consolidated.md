# ADR 0002 — Popup validation is already consolidated; do not "unify" it

- Status: Accepted
- Date: 2026-06-30
- Context surfaced by: architecture review (candidate #6, "consolidate popup shape knowledge")

## Context

An architecture review flagged the popup system as having validation "spread across
three representations" — `PopupSchema` (`src/lib/popup.ts`), the draft mapper
(`src/lib/popup-draft.ts`), and the admin form (`src/components/admin/PopupForm.tsx`)
— and proposed consolidating it. On inspection the premise does not hold.

## Decision

**We do not refactor popup validation.** The popup *shape* already has a single
source of truth, and the apparent "duplication" is three different layers that
legitimately reference the same locale set.

### The shape is already unified

`PopupSchema` (a Zod discriminated union) is the sole definition of a popup and is
enforced at every server boundary:

- `POST /api/admin/popups` and `PUT /api/admin/popups/[id]` → `PopupSchema.safeParse`
- `src/lib/popups-store.ts` → parses on every read *and* validates every write
- `GET /api/popups` → `PopupsSchema.safeParse`

`Popup` is `z.infer<typeof PopupSchema>`, so the type and the validator cannot
drift. There is no second definition of the popup shape.

### The "en + fr required" invariant is layered, not duplicated

The rule "en and fr are required locales; es/ar optional" appears in three places,
each serving a distinct concern:

| Location | Role | Consequence if it drifts |
| --- | --- | --- |
| `popup.ts` `Localized` | server-side validation authority; precisely typed `{ en: string; fr: string; es?: string; ar?: string }` | none — it is the gate |
| `popup-draft.ts` `buildLocalized` | flat-form → strict-shape mapping convenience | validation error, surfaced immediately on save |
| `PopupForm.tsx` `REQUIRED_LOCALES` | client UX (HTML `required` markers) | worse UX only; the server still rejects |

The schema is the security boundary (as `popup-draft.ts` itself notes: *"the server
still re-validates via PopupSchema, so this is convenience, not the security
boundary"*). The form and the mapper are conveniences at their own layers.

### Why unifying would be a net loss (deletion test)

Extracting a shared `REQUIRED_LOCALES` constant would concentrate almost nothing —
it moves a two-element array. Worse, deriving the schema's `Localized` object from
a locale list would **lose** the precise `{ en: string; fr: string }` static type
that the explicit `z.object({...})` provides, weakening compile-time safety at the
one layer that must not weaken. The change moves complexity (and degrades types)
rather than concentrating it — it fails the deletion test.

## Consequences

- Popup validation stays as-is: `PopupSchema` is the single source of truth for the
  shape; the draft mapper and form keep their layer-appropriate references to the
  required-locale set.
- Future architecture reviews should not re-propose "consolidating popup
  validation" without new evidence — e.g. a *fourth* independent definition of the
  popup shape appearing, or the required-locale set becoming large/volatile enough
  that a single constant would genuinely concentrate behaviour.
