// FAQ accordion built on native <details>/<summary> — content is in the DOM
// regardless of open state (crawlable), keyboard-accessible, works without JS.
export function Accordion({
  items,
}: {
  items: readonly { q: string; a: string }[];
}) {
  return (
    <div className="divide-y divide-tan/30 border-y border-tan/30">
      {items.map((item, i) => (
        <details key={i} className="group py-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-espresso outline-none focus-visible:ring-2 focus-visible:ring-tan focus-visible:ring-offset-4">
            {item.q}
            <span className="shrink-0 text-2xl font-normal text-tan transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="max-w-3xl pb-3 pt-2 leading-relaxed text-mocha">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
