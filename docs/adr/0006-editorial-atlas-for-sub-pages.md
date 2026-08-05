# ADR 0006: Use an Editorial Atlas for localized sub-pages

- Status: Proposed
- Date: 2026-08-05
- Context surfaced by: design review of the inner-page shell and screenshot feedback

## Context

The homepage now has a distinct visual system, but the inner routes still rely
on a generic `PageHeader` followed by a detached answer-first paragraph. On key
pages, the trust band and mobile CTA are inserted between that answer and the
useful content. Service details, guides, comparisons, FAQ, local information,
utility pages, and legal pages also have different visitor jobs but currently
share too much of the same reading rhythm.

The answer-first content is important for users, search engines, and AI answer
systems. It must remain visible near the page title in the rendered HTML, but
it should be presented as part of the page's information hierarchy rather than
as a loose SEO paragraph.

## Decision

Adopt the **Editorial Atlas** as the shared visual direction for all localized
HTML sub-pages. The system keeps one brand foundation while assigning each
sub-page family a composition suited to its job:

- Service pages use image-led heroes with price, facts, and booking context.
- Guides and comparisons lead with an answer or verdict, followed by evidence.
- FAQ and Laval use compact answer rails and grouped question or location facts.
- About, gallery, and reviews use trust or proof-led editorial compositions.
- Appointments and contact let the widget or form own the primary action.
- Terms and privacy use a quiet reading shell without marketing treatment.

The shared primitive is an **AnswerModule**. Its semantic position stays near
the H1, while its visual treatment varies by sub-page family. Metadata,
JSON-LD, breadcrumbs, routes, Markdown twins, analytics, and form fields stay
unchanged.

### Mobile behavior

Use adaptive mobile order. Service, guide, and comparison pages show the
title, answer, and primary action before supporting imagery or detail. About,
gallery, and reviews may lead with proof or imagery when that is the page's
job. FAQ and Laval lead with useful answers and visit facts. Appointments and
contact keep the widget or form prominent. Terms and privacy stay
reading-first. Every family collapses to one clear column below the mobile
breakpoint, with touch-safe controls and no accidental horizontal overflow.

Persistent mobile actions are contextual. Service detail pages may reserve a
safe-area-aware bottom bar for Book and Call. Appointments keep the booking
widget as the primary action, while informational, proof, and legal pages do
not inherit a sticky bar by default.

Comparison matrices use stacked decision cards on mobile. Each criterion stays
visible with clearly labeled alternatives, preserving the decision evidence
without relying on a narrow table or undiscoverable horizontal scrolling.

## Alternatives considered

### Salon Catalog

A dark title rail and paper content field would produce strong scanning and
clear fact grouping. It was not selected because it would make the entire site
feel more utilitarian than the brand requires.

### Image-led Service Journal

Photography-first pages with offset answer panels would create the strongest
visual impression. It was not selected as the universal system because FAQ,
appointments, legal, and contact pages need faster utility than a journal
layout provides.

## Consequences

- The generic `PageHeader + LeadParagraph` pairing can be replaced by
  family-aware `SubpageIntro` and `AnswerModule` primitives.
- Conversion actions become contextual instead of appearing as a repeated
  trust interruption in the middle of every key page.
- Existing content and SEO/GEO contracts remain portable while page layouts
  become more distinctive.
- Real service and team photography remains the visual foundation. Missing
  about and location imagery should be added selectively rather than replaced
  with generic stock assets.
- The first implementation should start with service and decision pages, then
  move through utility, visual, and legal families.
