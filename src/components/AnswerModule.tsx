import { dirFor, type Locale } from "@/lib/i18n";

export type AnswerVariant = "hero" | "rail" | "opening" | "verdict";

const variantClasses: Record<AnswerVariant, string> = {
  hero: "border-l-2 border-tan bg-cream px-5 py-5 md:px-7 md:py-6",
  rail: "border-y border-tan/35 py-5 md:py-6",
  opening: "border-l-2 border-tan bg-cream/70 px-5 py-5 md:px-7 md:py-6",
  verdict: "border-l-2 border-tan bg-tan/10 px-5 py-5 md:px-7 md:py-6",
};

// Plain server-rendered answer content. Keep this outside Reveal or any
// client-only wrapper so crawlers and no-JS visitors receive the answer on the
// first response.
export function AnswerModule({
  lang,
  text,
  label,
  variant = "rail",
}: {
  lang: Locale;
  text: string;
  label?: string;
  variant?: AnswerVariant;
}) {
  return (
    <div className={`mt-7 ${variantClasses[variant]}`} dir={dirFor(lang)}>
      {label ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-tan">
          {label}
        </p>
      ) : null}
      <p className="max-w-3xl text-lg leading-relaxed text-mocha md:text-xl">
        {text}
      </p>
    </div>
  );
}
