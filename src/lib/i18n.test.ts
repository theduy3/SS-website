// hreflangAlternates is the single owner of the locale-prefix + x-default rule
// that seo.ts (relative) and sitemap.ts (absolute) both project. These pin the
// invariant the two former copies encoded: locale-prefixed paths, x-default →
// defaultLocale, key order stable, relative vs absolute via `base`.

import { describe, it, expect } from "vitest";
import {
  locales,
  defaultLocale,
  sameForAll,
  hreflangAlternates,
} from "./i18n";

describe("sameForAll", () => {
  it("maps every locale to the one shared route", () => {
    const map = sameForAll("/about");
    expect(Object.keys(map).sort()).toEqual([...locales].sort());
    for (const l of locales) expect(map[l]).toBe("/about");
  });
});

describe("hreflangAlternates", () => {
  const perLocale = { en: "/x-en", fr: "/x-fr", es: "/x-es", ar: "/x-ar" };

  it("prefixes each locale and sets x-default to defaultLocale's entry (relative)", () => {
    const map = hreflangAlternates(perLocale);
    expect(map.en).toBe("/en/x-en");
    expect(map.fr).toBe("/fr/x-fr");
    expect(map["x-default"]).toBe(`/${defaultLocale}${perLocale[defaultLocale]}`);
    expect(map["x-default"]).toBe("/fr/x-fr");
  });

  it("prefixes an absolute base for the sitemap projection", () => {
    const map = hreflangAlternates(perLocale, "https://example.com");
    expect(map.en).toBe("https://example.com/en/x-en");
    expect(map["x-default"]).toBe("https://example.com/fr/x-fr");
  });

  it("emits keys in locale order followed by x-default (stable serialization)", () => {
    expect(Object.keys(hreflangAlternates(perLocale))).toEqual([
      ...locales,
      "x-default",
    ]);
  });

  it("a shared route via sameForAll yields identical paths per locale", () => {
    const map = hreflangAlternates(sameForAll("/about"));
    expect(map.en).toBe("/en/about");
    expect(map.ar).toBe("/ar/about");
    expect(map["x-default"]).toBe("/fr/about");
  });
});
