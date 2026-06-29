// Unit tests for locale-aware price formatting (format.ts). The fr locale puts
// the $ symbol AFTER the amount ("50 $"); every other locale prefixes it.

import { describe, it, expect } from "vitest";
import { formatPrice, formatFromPrice, formatPriceRange } from "./format";

describe("formatPrice", () => {
  it("prefixes the symbol for non-fr locales", () => {
    expect(formatPrice("en", 50)).toBe("$50");
    expect(formatPrice("es", 70)).toBe("$70");
    expect(formatPrice("ar", 15)).toBe("$15");
  });

  it("suffixes the symbol for fr", () => {
    expect(formatPrice("fr", 50)).toBe("50 $");
  });
});

describe("formatFromPrice", () => {
  it("joins the localized 'from' word with the price", () => {
    expect(formatFromPrice("en", 50, "from")).toBe("from $50");
    expect(formatFromPrice("fr", 50, "à partir de")).toBe("à partir de 50 $");
  });
});

describe("formatPriceRange", () => {
  it("renders an en-dash range with prefixed symbols for non-fr locales", () => {
    expect(formatPriceRange("en", 50, 100)).toBe("$50–$100");
    expect(formatPriceRange("es", 70, 120)).toBe("$70–$120");
  });

  it("renders a single trailing symbol for fr", () => {
    expect(formatPriceRange("fr", 50, 100)).toBe("50–100 $");
  });

  it("uses an en dash (U+2013), not a hyphen", () => {
    expect(formatPriceRange("en", 50, 100)).toContain("–");
    expect(formatPriceRange("en", 50, 100)).not.toContain("-");
  });
});
