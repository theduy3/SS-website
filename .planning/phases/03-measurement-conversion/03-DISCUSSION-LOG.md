# Phase 3: Measurement & Conversion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 3-Measurement & Conversion
**Areas discussed:** GA4 setup & consent, Conversion events & booking, Sticky CTA & trust signals, CWV / web-vitals RUM

---

## GA4 setup & consent

### Measurement ID wiring
| Option | Description | Selected |
|--------|-------------|----------|
| Env var (NEXT_PUBLIC_GA_ID) | Scaffold next/script reading env; ID set in Dokploy; no-op if unset | ✓ |
| Hardcode the G-ID | Inline the measurement ID; bakes into bundle/git | |
| You decide | — | |

### Consent posture (Law 25)
| Option | Description | Selected |
|--------|-------------|----------|
| Consent Mode v2, default-denied | analytics_storage denied until opt-in via banner | ✓ |
| Load unconditionally | GA4 fires on load, IP-anon, no banner | |
| You decide | — | |

### AI-referrer capture
| Option | Description | Selected |
|--------|-------------|----------|
| Channel-group regex only | Claude writes regex; user pastes into GA4 console | ✓ |
| Regex + code-side tagging | Channel group plus code-side referrer stamping | |
| You decide | — | |

### Consent banner shape
| Option | Description | Selected |
|--------|-------------|----------|
| Minimal Accept/Decline, 4 locales | One-line bottom bar, dict-driven, RTL-aware, real Decline | ✓ |
| Accept-only (implied dismiss) | Single OK/dismiss, no explicit decline | |
| You decide | — | |

**User's choice:** Env var · Consent Mode v2 default-denied · channel-group regex only · minimal 4-locale Accept/Decline banner.
**Notes:** GA4 console work (property, channel-group regex paste) is the user's job — Claude can't reach GA4 admin. Channel can't backfill → configure before first new page ships.

---

## Conversion events & booking

### Event naming
| Option | Description | Selected |
|--------|-------------|----------|
| GA4 recommended + custom mix | generate_lead (form) + phone_click + book_cta_click | ✓ |
| All custom descriptive | phone_click / contact_submit / book_cta_click | |
| You decide | — | |

### Booking measurement depth
| Option | Description | Selected |
|--------|-------------|----------|
| Track CTA click only (intent) | book_cta_click; completion unmeasured (SalonX cross-domain) | ✓ |
| Attempt cross-domain completion | GA4 linker / postMessage; needs SalonX cooperation | |
| You decide | — | |

### Hook locus
| Option | Description | Selected |
|--------|-------------|----------|
| Component-level (DRY) | Instrument phone link, Button(book), ContactForm once | ✓ |
| Per-key-page wiring | Add tracking explicitly per key page | |
| You decide | — | |

**User's choice:** Recommended+custom names · CTA-click intent only · component-level hooks.
**Notes:** Booking completes inside the SalonX iframe (app.onglessanssouci.com) — only the intent click is reachable from this app.

---

## Sticky CTA & trust signals

### Sticky bar actions
| Option | Description | Selected |
|--------|-------------|----------|
| Call + Book | tel: + Book buttons; both fire conversion events | ✓ |
| Book only | Single Book button | |
| Call + Book + Directions | Adds maps link; cramped at 375px | |

### Above-fold trust signals
| Option | Description | Selected |
|--------|-------------|----------|
| Rating + review count + years | All three; needs founding year added to site.ts | ✓ |
| Rating + review count only | Existing data; drops roadmap-mandated years | |
| You decide | — | |

### Scope + behavior
| Option | Description | Selected |
|--------|-------------|----------|
| Key pages, always visible | Home, services, /services/[slug], FAQ, /laval; pinned | ✓ |
| All pages, hide-on-scroll-down | Every page; reveal on scroll-up | |
| You decide | — | |

**User's choice:** Call+Book bar · rating + review count + years · key pages always-visible.
**Notes:** Founding year = **2024** (provided via free text) → static "Since 2024" in site.ts. Flagged: years is a thin signal for a 2024 salon; rating/reviewCount are primary, "Since 2024" secondary. User preferred static "Since 20XX" framing over a computed yearly-ticking number.

---

## CWV / web-vitals RUM

### RUM sink
| Option | Description | Selected |
|--------|-------------|----------|
| GA4 events (consent-gated) | web_vitals events; reuses GA4 tag; consent-gated | ✓ |
| GA4 events, always-on | Same but not consent-gated | |
| Dev/console only for now | Local log, no production sink | |

### Framer Motion double-load fix
| Option | Description | Selected |
|--------|-------------|----------|
| Add analyzer + verify; refactor only if dup found | @next/bundle-analyzer behind ANALYZE=true, evidence-first | ✓ |
| Proactively centralize motion now | Refactor all motion imports regardless | |
| You decide | — | |

### CWV scope
| Option | Description | Selected |
|--------|-------------|----------|
| Key pages only | Home, services, /services/[slug], FAQ, /laval | ✓ |
| All public pages | Every public route | |
| You decide | — | |

**User's choice:** GA4 web_vitals events consent-gated · analyzer verify-then-refactor · key pages only.
**Notes:** web-vitals not yet installed. Refactor is conditional on proven duplication, not assumed.

---

## Claude's Discretion

- GA4 event payload/param shapes beyond chosen event names.
- Consent-state storage mechanism (cookie vs localStorage) — SSR-safe.
- Exact AI-referrer channel-group regex (Claude drafts; user pastes).
- bundle-analyzer script/CI wiring.
- Sticky-bar styling within the existing design system.
- Which events to mark as GA4 "key events" (conversions) — Claude recommends.

## Deferred Ideas

- Cross-domain booking-completion tracking (GA4 linker / SalonX postMessage) — needs SalonX cooperation; revisit if hooks exposed.
- Code-side AI-referrer tagging (belt-and-suspenders) — declined for v1; revisit only if channel-group regex drops sources.
