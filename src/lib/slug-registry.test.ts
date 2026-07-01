// Unit tests for the slug registry — the single test surface for the locale↔slug
// ↔path mechanics shared by services/guides/comparisons. Uses a fixture registry
// so the test exercises the generic module, not any one content type. Covers the
// es/ar locales explicitly (closes the historical gap where only one assertion
// validated non-en/fr URLs).

import { describe, it, expect } from "vitest";
import { locales, type Locale } from "@/lib/i18n";
import { slugRegistry } from "./slug-registry";

type Fixture = { id: string; slug: Record<Locale, string> };

const entities: readonly Fixture[] = [
  { id: "alpha", slug: { en: "alpha", fr: "alpha-fr", es: "alpha-es", ar: "alpha-ar" } },
  { id: "beta", slug: { en: "beta", fr: "beta-fr", es: "beta-es", ar: "beta-ar" } },
] as const;

const reg = slugRegistry(entities, "/things");

describe("slugRegistry", () => {
  it("exposes the raw entity array via all", () => {
    expect(reg.all).toBe(entities);
  });

  it("slugParams returns only the requested locale's slugs", () => {
    expect(reg.slugParams("fr")).toEqual([{ slug: "alpha-fr" }, { slug: "beta-fr" }]);
    expect(reg.slugParams("ar")).toEqual([{ slug: "alpha-ar" }, { slug: "beta-ar" }]);
  });

  it("bySlug resolves a localized slug to its entity", () => {
    expect(reg.bySlug("es", "beta-es")?.id).toBe("beta");
    expect(reg.bySlug("en", "alpha")?.id).toBe("alpha");
  });

  it("bySlug returns undefined for an unknown or wrong-locale slug (404 contract)", () => {
    expect(reg.bySlug("en", "nope")).toBeUndefined();
    // "alpha-fr" is the fr slug; asking under en must miss.
    expect(reg.bySlug("en", "alpha-fr")).toBeUndefined();
  });

  it("path prefixes the locale's slug", () => {
    expect(reg.path(entities[0], "fr")).toBe("/things/alpha-fr");
    expect(reg.path(entities[1], "ar")).toBe("/things/beta-ar");
  });

  it("pathsByLocale emits every locale, including es and ar", () => {
    const map = reg.pathsByLocale(entities[0]);
    expect(Object.keys(map).sort()).toEqual([...locales].sort());
    expect(map.en).toBe("/things/alpha");
    expect(map.fr).toBe("/things/alpha-fr");
    expect(map.es).toBe("/things/alpha-es");
    expect(map.ar).toBe("/things/alpha-ar");
  });

  it("round-trips: every entity resolves from its own slug in every locale", () => {
    for (const e of entities) {
      for (const lang of locales) {
        expect(reg.bySlug(lang, e.slug[lang])?.id).toBe(e.id);
      }
    }
  });
});
