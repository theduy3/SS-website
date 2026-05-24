import type { Popup } from "@/lib/popup";
import { locales, type Locale } from "@/lib/i18n";

// Flat, all-strings form model for editing a popup, plus conversions to/from the
// strict Popup shape. Keeping this here (not in the component) makes the mapping
// reusable and easy to reason about; the server still re-validates via
// PopupSchema, so this is convenience, not the security boundary.

// <input type="datetime-local"> only accepts "YYYY-MM-DDTHH:mm" (no seconds, no
// timezone). Popups store UTC ISO strings. These bridge the two, interpreting the
// input as the admin's LOCAL wall-clock: ISO(UTC) -> local for display, local -> ISO(UTC) on save.
export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datetimeLocalToISO(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v); // no 'Z' -> parsed as local time
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export type Draft = {
  id: string;
  version: number;
  priority: number;
  startsAt: string; // datetime-local value or "" (= no bound)
  endsAt: string;
  frequency: Popup["frequency"];
  type: Popup["type"];
  // rich fields
  title: Record<Locale, string>;
  body: Record<Locale, string>;
  ctaLabel: Record<Locale, string>;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  // embed field
  html: string;
};

function emptyLocalized(): Record<Locale, string> {
  return Object.fromEntries(locales.map((l) => [l, ""])) as Record<
    Locale,
    string
  >;
}

function fill(
  rec: Partial<Record<Locale, string>> | undefined,
): Record<Locale, string> {
  const out = emptyLocalized();
  if (rec) for (const l of locales) out[l] = rec[l] ?? "";
  return out;
}

export function emptyDraft(): Draft {
  return {
    id: "",
    version: 1,
    priority: 0,
    startsAt: "",
    endsAt: "",
    frequency: "session",
    type: "rich",
    title: emptyLocalized(),
    body: emptyLocalized(),
    ctaLabel: emptyLocalized(),
    ctaHref: "",
    imageUrl: "",
    imageAlt: "",
    html: "",
  };
}

export function toDraft(p: Popup): Draft {
  const base: Draft = {
    ...emptyDraft(),
    id: p.id,
    version: p.version,
    priority: p.priority,
    startsAt: isoToDatetimeLocal(p.startsAt),
    endsAt: isoToDatetimeLocal(p.endsAt),
    frequency: p.frequency,
    type: p.type,
  };
  if (p.type === "rich") {
    return {
      ...base,
      title: fill(p.title),
      body: fill(p.body),
      ctaLabel: fill(p.cta?.label),
      ctaHref: p.cta?.href ?? "",
      imageUrl: p.image?.url ?? "",
      imageAlt: p.image?.alt ?? "",
    };
  }
  return { ...base, html: p.html };
}

// Keep en/fr (required by the schema) and only include es/ar when non-empty.
function buildLocalized(
  rec: Record<Locale, string>,
): { en: string; fr: string } & Partial<Record<Locale, string>> {
  const out: { en: string; fr: string } & Partial<Record<Locale, string>> = {
    en: rec.en.trim(),
    fr: rec.fr.trim(),
  };
  if (rec.es.trim()) out.es = rec.es.trim();
  if (rec.ar.trim()) out.ar = rec.ar.trim();
  return out;
}

export function toPopup(d: Draft): Popup {
  const base = {
    id: d.id.trim(),
    version: d.version,
    priority: d.priority,
    startsAt: datetimeLocalToISO(d.startsAt),
    endsAt: datetimeLocalToISO(d.endsAt),
    frequency: d.frequency,
  };

  if (d.type === "embed") {
    return { ...base, type: "embed", html: d.html };
  }

  return {
    ...base,
    type: "rich",
    image: d.imageUrl.trim()
      ? { url: d.imageUrl.trim(), alt: d.imageAlt.trim() }
      : null,
    title: buildLocalized(d.title),
    body: buildLocalized(d.body),
    cta: d.ctaHref.trim()
      ? { label: buildLocalized(d.ctaLabel), href: d.ctaHref.trim() }
      : null,
  };
}
