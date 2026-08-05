import type { ReactNode } from "react";

export type FactRow = { label: string; value: ReactNode };

// A compact, readable fact rail for high-intent pages. The values stay in the
// initial HTML and become one column on small screens instead of squeezing a
// desktop table into a narrow viewport.
export function FactRail({
  label,
  rows,
  className = "",
}: {
  label: string;
  rows: readonly FactRow[];
  className?: string;
}) {
  return (
    <section
      className={`border-y border-espresso/15 py-5 md:py-6 ${className}`}
      aria-label={label}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tan">
        {label}
      </p>
      <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((row) => (
          <div key={row.label} className="border-t border-fog pt-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-mocha">
              {row.label}
            </dt>
            <dd className="mt-1 leading-relaxed text-espresso">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
