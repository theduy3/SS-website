"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";

// EN/FR toggle. Links to the same path in the other locale and stores the
// choice in the NEXT_LOCALE cookie so the proxy honours it on later visits
// (manual choice overrides device language).
export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  const pathFor = (target: Locale) => {
    const rest = pathname.replace(/^\/(en|fr)(?=\/|$)/, "");
    return `/${target}${rest}`;
  };

  return (
    <div className="flex items-center gap-2 text-sm uppercase tracking-wide">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-cream/30">/</span>}
          <Link
            href={pathFor(l)}
            onClick={() => {
              document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000`;
            }}
            aria-current={l === locale ? "true" : undefined}
            className={l === locale ? "font-semibold text-cream" : "text-cream/60 hover:text-tan"}
          >
            {l}
          </Link>
        </span>
      ))}
    </div>
  );
}
