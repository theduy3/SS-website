// Unit tests for SpecTable — the service-page "quick facts" block. Intent: the
// table must be a real, self-contained <table> with row-header semantics so AI
// crawlers and assistive tech extract each fact as a labelled key/value pair.

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SpecTable } from "./SpecTable";

const rows = [
  { label: "Starting price", value: "$50" },
  { label: "Price range", value: "$50–$100" },
  { label: "Duration", value: "About 45–60 minutes" },
];

describe("SpecTable", () => {
  it("renders the caption", () => {
    render(<SpecTable caption="Quick facts" rows={rows} />);
    // <caption> is exposed with the table's accessible name.
    expect(screen.getByText("Quick facts")).toBeInTheDocument();
  });

  it("renders every row as a labelled key/value pair", () => {
    render(<SpecTable caption="Quick facts" rows={rows} />);
    for (const row of rows) {
      // Each label is a row header (scope="row") → queryable as a rowheader cell.
      const header = screen.getByRole("rowheader", { name: row.label });
      const tr = header.closest("tr")!;
      expect(within(tr).getByText(row.value)).toBeInTheDocument();
    }
  });

  it("emits exactly one data row per spec", () => {
    render(<SpecTable caption="Quick facts" rows={rows} />);
    // rowgroup(tbody) → one <tr> per row, no extra header row in tbody.
    expect(screen.getAllByRole("row")).toHaveLength(rows.length);
  });
});
