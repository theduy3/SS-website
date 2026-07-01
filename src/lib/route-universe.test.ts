// Tests for the route universe — the single enumeration sitemap.ts and
// md-routes.ts both project. Guards the structural invariants the two consumers
// rely on: group order, per-locale completeness, and the date-key quirks
// (home → "/", comparisons/guides → EN path) that can't be reconstructed downstream.

import { describe, it, expect } from "vitest";
import { locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import { services } from "@/lib/services";
import { comparisons } from "@/lib/comparisons";
import { guides } from "@/lib/guides";
import { routeUniverse, type RouteGroup } from "./route-universe";

const GROUP_ORDER: RouteGroup[] = [
  "nav",
  "secondary",
  "local",
  "services",
  "comparisons",
  "guides",
];

describe("routeUniverse", () => {
  const universe = routeUniverse();

  it("enumerates every group × locale × item once", () => {
    const items =
      site.nav.length +
      site.secondaryNav.length +
      1 + // /laval
      services.length +
      comparisons.length +
      guides.length;
    expect(universe).toHaveLength(items * locales.length);
  });

  it("keeps groups in canonical order (no interleaving)", () => {
    const firstIndex = GROUP_ORDER.map((g) => universe.findIndex((e) => e.group === g));
    const sorted = [...firstIndex].sort((a, b) => a - b);
    expect(firstIndex).toEqual(sorted);
    // every entry's group is one of the known groups
    expect(universe.every((e) => GROUP_ORDER.includes(e.group))).toBe(true);
  });

  it("gives every entry a full per-locale path map", () => {
    for (const e of universe) {
      expect(Object.keys(e.pathByLocale).sort()).toEqual([...locales].sort());
    }
  });

  it("keys the home nav entry on '/' (not its collapsed '' path)", () => {
    const home = universe.find((e) => e.group === "nav" && e.pathByLocale.en === "");
    expect(home).toBeDefined();
    expect(home!.dateKey).toBe("/");
  });

  it("keys comparisons/guides on their EN path", () => {
    const cmp = universe.find((e) => e.group === "comparisons");
    expect(cmp!.dateKey).toBe(cmp!.pathByLocale.en);
    expect(cmp!.dateKey.startsWith("/comparisons/")).toBe(true);
  });
});
