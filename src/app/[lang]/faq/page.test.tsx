// SSR-layer tests for the FAQ page answer-first lead (02-01).
//
// Asserts:
//   (a) dict.faq.lead is a non-empty string for every locale.
//   (b) faqPageGraph() returns @type "FAQPage" with all items.
//   (c) faq.items count is equal across all locales (SCHEMA-02 single-source invariant).
//
// Note: getDictionary is guarded by "server-only". We import the JSON files
// directly — same data, no server-only boundary in vitest/jsdom.

import { describe, it, expect } from "vitest";
import en from "@/dictionaries/en.json";
import fr from "@/dictionaries/fr.json";
import es from "@/dictionaries/es.json";
import ar from "@/dictionaries/ar.json";
import { faqPageGraph } from "@/lib/seo";
import type { Locale } from "@/lib/i18n";

const dicts = { en, fr, es, ar } as const;
const LOCALES = ["en", "fr", "es", "ar"] as const satisfies readonly Locale[];

describe("faq page — answer-first lead (02-01)", () => {
  for (const lang of LOCALES) {
    it(`dict.faq.lead is a non-empty string for locale "${lang}"`, () => {
      const dict = dicts[lang];
      expect(typeof dict.faq.lead).toBe("string");
      expect(dict.faq.lead.trim().length).toBeGreaterThan(0);
    });
  }
});

describe("faq page — faqPageGraph schema (02-01)", () => {
  const dict = en;
  const graph = faqPageGraph(dict.faq.items);

  it('faqPageGraph returns @type "FAQPage"', () => {
    expect(graph["@type"]).toBe("FAQPage");
  });

  it("faqPageGraph mainEntity length equals dict.faq.items length", () => {
    expect(graph.mainEntity).toHaveLength(dict.faq.items.length);
  });

  it("faq.items count is equal across all locales (single-source invariant)", () => {
    const counts = LOCALES.map((lang) => dicts[lang].faq.items.length);
    const unique = new Set(counts);
    expect(unique.size).toBe(1);
  });

  it("faq.items count is within 8-15 range", () => {
    expect(dict.faq.items.length).toBeGreaterThanOrEqual(8);
    expect(dict.faq.items.length).toBeLessThanOrEqual(15);
  });
});
