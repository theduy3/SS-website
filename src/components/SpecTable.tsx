// Self-contained "quick facts" spec sheet for a service page. Pure presentational
// server component — a 2-column key/value table (criterion → value) rendered into
// the HTML so AI crawlers (which do NOT execute JS) read it as one extractable
// fact block. Distinct from ComparisonTable, which is an N-option matrix; here
// every row is a single self-contained claim about one service.

type SpecRow = { label: string; value: string };

export function SpecTable({
  caption,
  rows,
}: {
  caption: string;
  rows: readonly SpecRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-mocha">
        <caption className="px-3 pb-3 text-left text-sm font-semibold uppercase tracking-wide text-espresso">
          {caption}
        </caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-fog">
              <th
                scope="row"
                className="w-2/5 px-3 py-3 font-medium text-espresso"
              >
                {row.label}
              </th>
              <td className="px-3 py-3 leading-relaxed">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
