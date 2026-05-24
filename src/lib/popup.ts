import { z } from "zod";
import { defaultLocale, type Locale } from "@/lib/i18n";

// en/fr always present; es/ar optional (owner's app may not translate all).
const Localized = z.object({
  en: z.string(),
  fr: z.string(),
  es: z.string().optional(),
  ar: z.string().optional(),
});

const Base = z.object({
  id: z.string().min(1),
  version: z.number().int().nonnegative().default(0),
  priority: z.number().int().default(0),
  startsAt: z.string().nullable().default(null), // ISO; null = no bound
  endsAt: z.string().nullable().default(null),
  frequency: z.enum(["once", "session", "daily", "always"]).default("session"),
});

const RichPopup = Base.extend({
  type: z.literal("rich"),
  image: z
    .object({ url: z.url(), alt: z.string().default("") })
    .nullable()
    .default(null),
  title: Localized,
  body: Localized,
  cta: z
    .object({ label: Localized, href: z.string().min(1) })
    .nullable()
    .default(null),
});

const EmbedPopup = Base.extend({
  type: z.literal("embed"),
  html: z.string().min(1),
});

export const PopupSchema = z.discriminatedUnion("type", [
  RichPopup,
  EmbedPopup,
]);
export const PopupsSchema = z.array(PopupSchema);
export type Popup = z.infer<typeof PopupSchema>;

// Active pop-ups (those whose [startsAt, endsAt] window contains `now`), ordered
// highest-priority first. Ties break by id so the order is deterministic across
// reads. The per-visitor frequency/seen check is applied client-side, so the
// feed returns the whole eligible list rather than pre-selecting one popup.
export function pickActiveSorted(popups: Popup[], now: Date): Popup[] {
  const t = now.getTime();
  const active = popups.filter((p) => {
    const startOk = !p.startsAt || Date.parse(p.startsAt) <= t;
    const endOk = !p.endsAt || Date.parse(p.endsAt) >= t;
    return startOk && endOk;
  });
  // `active` is a fresh array from filter(); sorting it does not mutate input.
  return active.sort(
    (a, b) => b.priority - a.priority || a.id.localeCompare(b.id),
  );
}

// Highest-priority active pop-up, or null when none are active.
export function pickActive(popups: Popup[], now: Date): Popup | null {
  return pickActiveSorted(popups, now)[0] ?? null;
}

// Locale text with fallback: requested → default (fr) → en → empty.
export function pickText(
  text: Partial<Record<Locale, string>>,
  locale: Locale,
): string {
  return text[locale] || text[defaultLocale] || text.en || "";
}
