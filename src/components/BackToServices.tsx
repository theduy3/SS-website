import Link from "next/link";
import { dirFor, type Locale } from "@/lib/i18n";
import { Reveal } from "@/components/Reveal";

// Shared "← all services" back-link at the top of key content pages. The arrow
// flips direction in RTL locales. Rendered verbatim on the three slug pages; this
// is its single owner.
export function BackToServices({
  lang,
  label,
}: {
  lang: Locale;
  label: string;
}) {
  return (
    <Reveal>
      <Link
        href={`/${lang}/services`}
        className="text-sm uppercase tracking-widest text-mocha hover:text-espresso"
      >
        {dirFor(lang) === "rtl" ? "→" : "←"} {label}
      </Link>
    </Reveal>
  );
}
