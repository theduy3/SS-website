// SSR-layer tests for the home page answer-first lead and ItemList schema (02-01).
//
// Asserts:
//   (a) dict.home.lead exists and is a non-empty string for every locale.
//   (b) servicesGraph() returns @type: "ItemList" with one entry per service.
//   (c) Each ItemList element carries a "Service" @type and a numeric position.
//
// Note: getDictionary is guarded by "server-only". We import the JSON files
// directly — same data, no server-only boundary in vitest/jsdom.

import { describe, it, expect } from "vitest";
import en from "@/dictionaries/en.json";
import fr from "@/dictionaries/fr.json";
import es from "@/dictionaries/es.json";
import ar from "@/dictionaries/ar.json";
import { servicesGraph } from "@/lib/seo";
import { services, servicePath } from "@/lib/services";
import type { Locale } from "@/lib/i18n";

const dicts = { en, fr, es, ar } as const;
const LOCALES = ["en", "fr", "es", "ar"] as const satisfies readonly Locale[];

describe("home page — answer-first lead (02-01)", () => {
  for (const lang of LOCALES) {
    it(`dict.home.lead is a non-empty string for locale "${lang}"`, () => {
      const dict = dicts[lang];
      expect(typeof dict.home.lead).toBe("string");
      expect(dict.home.lead.trim().length).toBeGreaterThan(0);
    });
  }
});

describe("home page — servicesGraph ItemList schema (02-01)", () => {
  const lang: Locale = "en";
  const dict = en;
  const items = services.map((s) => ({
    name: dict.serviceDetails[s.id as keyof typeof dict.serviceDetails].title,
    description:
      dict.serviceDetails[s.id as keyof typeof dict.serviceDetails].metaDescription,
    price: s.price,
    priceTo: s.priceTo,
    path: servicePath(s, lang),
  }));
  const graph = servicesGraph(lang, items);

  it('servicesGraph returns @type "ItemList"', () => {
    expect(graph["@type"]).toBe("ItemList");
  });

  it("servicesGraph itemListElement length matches services registry", () => {
    expect(graph.itemListElement).toHaveLength(services.length);
  });

  it('each itemListElement has @type "Service" and numeric position', () => {
    for (const [i, el] of graph.itemListElement.entries()) {
      expect(el["@type"]).toBe("Service");
      expect(el.position).toBe(i + 1);
    }
  });
});
