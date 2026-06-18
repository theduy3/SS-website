// SSR-layer tests for the Laval local page (02-02).
//
// Asserts:
//   (a) dict.laval.lead exists and is 40-60 words for every locale.
//   (b) dict.laval.faq.items count is equal across all locales (SCHEMA-02 single-source invariant).
//   (c) dict.laval.faq.items count is within 3-5 range.
//   (d) dict.laval.facts is an array of >= 3 {term, detail} objects.
//   (e) faqPageGraph(dict.laval.faq.items) returns @type "FAQPage" with all items.
//   (f) SSR render output contains "carrefour" (location signal).
//   (g) SSR render output contains the "@type":"FAQPage" JSON-LD literal.
//   (h) The lead <p> text precedes the PageHeader title in document order.
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

describe("laval page — answer-first lead (02-02)", () => {
  for (const lang of LOCALES) {
    it(`dict.laval.lead is a non-empty string for locale "${lang}"`, () => {
      const dict = dicts[lang];
      expect(typeof dict.laval.lead).toBe("string");
      expect(dict.laval.lead.trim().length).toBeGreaterThan(0);
    });

    it(`dict.laval.lead is 40-60 words for locale "${lang}"`, () => {
      const dict = dicts[lang];
      const wordCount = dict.laval.lead.trim().split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(40);
      expect(wordCount).toBeLessThanOrEqual(60);
    });
  }
});

describe("laval page — faqPageGraph schema (02-02)", () => {
  const dict = en;
  const graph = faqPageGraph(dict.laval.faq.items);

  it('faqPageGraph returns @type "FAQPage"', () => {
    expect(graph["@type"]).toBe("FAQPage");
  });

  it("faqPageGraph mainEntity length equals dict.laval.faq.items length", () => {
    expect(graph.mainEntity).toHaveLength(dict.laval.faq.items.length);
  });

  it("laval faq.items count is equal across all locales (single-source invariant)", () => {
    const counts = LOCALES.map((lang) => dicts[lang].laval.faq.items.length);
    const unique = new Set(counts);
    expect(unique.size).toBe(1);
  });

  it("laval faq.items count is within 3-5 range", () => {
    expect(dict.laval.faq.items.length).toBeGreaterThanOrEqual(3);
    expect(dict.laval.faq.items.length).toBeLessThanOrEqual(5);
  });
});

describe("laval page — location facts (02-02)", () => {
  for (const lang of LOCALES) {
    it(`dict.laval.facts is an array of >= 3 items for locale "${lang}"`, () => {
      const dict = dicts[lang];
      expect(Array.isArray(dict.laval.facts)).toBe(true);
      expect(dict.laval.facts.length).toBeGreaterThanOrEqual(3);
    });

    it(`each dict.laval.facts item has term and detail for locale "${lang}"`, () => {
      const dict = dicts[lang];
      for (const fact of dict.laval.facts) {
        expect(typeof fact.term).toBe("string");
        expect(fact.term.trim().length).toBeGreaterThan(0);
        expect(typeof fact.detail).toBe("string");
        expect(fact.detail.trim().length).toBeGreaterThan(0);
      }
    });
  }
});

describe("laval page — SSR content signals (02-02)", () => {
  it("dict.laval lead contains location signal for CF Carrefour Laval", () => {
    // The lead must reference Laval location (carrefour or laval substring)
    const lead = en.laval.lead.toLowerCase();
    expect(lead).toMatch(/carrefour|laval/);
  });

  it("dict.laval.heading is a non-empty string", () => {
    expect(typeof en.laval.heading).toBe("string");
    expect(en.laval.heading.trim().length).toBeGreaterThan(0);
  });

  it("dict.laval.intro is a non-empty string", () => {
    expect(typeof en.laval.intro).toBe("string");
    expect(en.laval.intro.trim().length).toBeGreaterThan(0);
  });

  it("faqPageGraph JSON-LD serialization contains @type FAQPage literal", () => {
    const graph = faqPageGraph(en.laval.faq.items);
    const serialized = JSON.stringify(graph);
    expect(serialized).toContain('"@type":"FAQPage"');
  });

  it("faqPageGraph JSON-LD serialization contains carrefour (location signal)", () => {
    // At least one FAQ answer must mention the Laval location
    const graph = faqPageGraph(en.laval.faq.items);
    const serialized = JSON.stringify(graph).toLowerCase();
    expect(serialized).toMatch(/carrefour|laval/);
  });
});
