// Tests for the related-links selector — the single source both the HTML service
// page and the .md twin consume for related comparison/guide membership, order,
// title, and path. Uses the real registries + the real en dictionary.

import { describe, it, expect } from "vitest";
import en from "@/dictionaries/en.json";
import type { Dictionary } from "@/lib/dictionary";
import { relatedLinks } from "./related-links";
import { comparisonsForService } from "@/lib/comparisons";
import { guidesForService } from "@/lib/guides";

const dict = en as Dictionary;
const titles = dict.comparisons as Record<string, { title: string }>;

describe("relatedLinks", () => {
  it("returns all comparisons before all guides, matching the registries", () => {
    const r = relatedLinks("manicure", "en", dict);
    const kinds = r.map((x) => x.kind);
    const lastComparison = kinds.lastIndexOf("comparison");
    const firstGuide = kinds.indexOf("guide");
    expect(lastComparison).toBeLessThan(firstGuide); // no interleaving
    expect(r.filter((x) => x.kind === "comparison")).toHaveLength(
      comparisonsForService("manicure").length,
    );
    expect(r.filter((x) => x.kind === "guide")).toHaveLength(
      guidesForService("manicure").length,
    );
  });

  it("resolves the localized title and a live comparison path", () => {
    const first = relatedLinks("manicure", "en", dict)[0];
    expect(first.kind).toBe("comparison");
    expect(first.path.startsWith("/comparisons/")).toBe(true);
    expect(first.title).toBe(titles[first.id].title);
  });

  it("is empty for a service with no related content", () => {
    expect(relatedLinks("pedicure", "en", dict)).toEqual([]);
  });

  it("localizes the path per locale", () => {
    const enPath = relatedLinks("manicure", "en", dict)[0].path;
    const frPath = relatedLinks("manicure", "fr", dict)[0].path;
    expect(enPath).not.toBe(frPath);
  });
});
