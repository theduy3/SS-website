import { site } from "@/lib/site";
import type { Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";

type HoursDict = Pick<Dictionary, "labels">;

const dayIndexes: Record<string, number> = {
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
  Su: 0,
};

const localeTags: Record<Locale, string> = {
  en: "en-CA",
  fr: "fr-CA",
  es: "es-CA",
  ar: "ar-SA",
};

function formatDay(day: string, locale: Locale) {
  const date = new Date(Date.UTC(2024, 0, 7 + dayIndexes[day]));
  return new Intl.DateTimeFormat(localeTags[locale], {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatTime(value: string, locale: Locale) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date(Date.UTC(2024, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat(localeTags[locale], {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale === "en",
    timeZone: "UTC",
  }).format(date);
}

export function OpeningHours({
  locale,
  dict,
  className = "",
}: {
  locale: Locale;
  dict: HoursDict;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-base text-tan">{dict.labels.hours}</h3>
      <ul className="mt-2 space-y-1 leading-relaxed">
        {site.hours.map((group) => (
          <li key={`${group.days.join("-")}-${group.opens}`}>
            <span>{group.days.map((day) => formatDay(day, locale)).join(" / ")}</span>{" "}
            <span>
              {formatTime(group.opens, locale)} - {formatTime(group.closes, locale)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
