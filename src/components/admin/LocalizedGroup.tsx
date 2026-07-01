"use client";

import { locales, defaultLocale, type Locale } from "@/lib/i18n";
import { inputClass } from "./field-style";

// The locales the server treats as mandatory (PopupSchema's Localized requires
// en + the default locale). Sole consumer is this module — it drives the "*"
// required markers and the HTML `required` attribute. Client convenience only;
// the server re-validates via PopupSchema (see ADR 0002).
const REQUIRED_LOCALES: readonly Locale[] = ["en", defaultLocale];

/**
 * A fieldset of per-locale text inputs for one localized field (title, body, …).
 * Renders every locale; marks en + the default locale required when `required`.
 * Interface: a label, the current per-locale values, and one onChange callback.
 */
export function LocalizedGroup({
  label,
  values,
  onChange,
  required,
}: {
  label: string;
  values: Record<Locale, string>;
  onChange: (locale: Locale, value: string) => void;
  required?: boolean;
}) {
  return (
    <fieldset className="rounded-xl border border-fog bg-beige/60 p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-mocha">
        {label}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {locales.map((loc) => {
          const isRequired = required && REQUIRED_LOCALES.includes(loc);
          return (
            <label key={loc} className="flex flex-col gap-1 text-xs">
              <span className="text-tan">
                {loc.toUpperCase()}
                {isRequired ? " *" : ""}
              </span>
              <input
                className={inputClass}
                value={values[loc]}
                required={isRequired}
                onChange={(e) => onChange(loc, e.target.value)}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
