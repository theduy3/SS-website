// Gate for the page-dates join. PAGE_DATES must exactly match the route
// universe's dateKeys — every published route has a date, and no orphan dates
// linger after a slug rename/removal. This is the enforcement that replaced the
// silent `?? FALLBACK_DATE`: a drift now fails here (and pageDate throws at
// build) instead of shipping a wrong `updated`/`lastModified` to SEO. Mirrors the
// repo's other parity gates (md-coverage.test.ts, standalone-routes.test.ts).

import { describe, it, expect } from "vitest";
import { PAGE_DATES, pageDate } from "./page-dates";
import { routeUniverse } from "./route-universe";

// The canonical key set: every dateKey the route universe publishes, deduped
// (services all share "/services"; locales collapse to the same key).
const universeKeys = new Set(routeUniverse().map((e) => e.dateKey));
const tableKeys = new Set(Object.keys(PAGE_DATES));

describe("page-dates ⇔ route-universe parity", () => {
  it("every published route dateKey has a date (no silent fallback)", () => {
    const missing = [...universeKeys].filter((k) => !tableKeys.has(k));
    expect(missing).toEqual([]);
  });

  it("every PAGE_DATES key maps to a real route (no orphan dates)", () => {
    const orphans = [...tableKeys].filter((k) => !universeKeys.has(k));
    expect(orphans).toEqual([]);
  });
});

describe("pageDate", () => {
  it("returns the YYYY-MM-DD date for a known key", () => {
    expect(pageDate("/services")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("throws loud for an unknown key (no silent fallback)", () => {
    expect(() => pageDate("/services/manicure")).toThrow(/no date registered/);
  });
});
