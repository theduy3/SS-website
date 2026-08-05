// Accessible comparison matrix for decision pages. Pure presentational server
// component — data comes from dict.comparisons[id] (columns + rows). The first
// column is a row-header (criterion); remaining cells are per-option values.

type Row = { label: string; cells: string[] };

export function ComparisonTable({
  columns,
  rows,
  caption,
}: {
  columns: string[];
  rows: Row[];
  caption?: string;
}) {
  return (
    <div>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article key={row.label} className="border-t border-espresso/15 py-4">
            <h3 className="text-lg text-espresso">{row.label}</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {row.cells.map((cell, i) => (
                <div key={`${row.label}-${i}`} className="bg-cream px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-tan">
                    {columns[i + 1]}
                  </dt>
                  <dd className="mt-1 leading-relaxed text-mocha">{cell}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[32rem] border-collapse text-left text-mocha">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-tan/50">
            {columns.map((col, i) => (
              <th
                key={col}
                scope="col"
                className={`px-3 py-3 text-sm font-semibold uppercase tracking-wide text-espresso ${
                  i === 0 ? "" : "text-center"
                }`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-fog">
              <th
                scope="row"
                className="px-3 py-3 font-medium text-espresso"
              >
                {row.label}
              </th>
              {row.cells.map((cell, i) => (
                <td
                  key={`${row.label}-${i}`}
                  className="px-3 py-3 text-center leading-relaxed"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
