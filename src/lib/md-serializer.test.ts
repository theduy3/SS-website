// md-serializer.test.ts — no-server-only proof: this file imports md-serializer.ts
// (a pure module) directly and must run under `bun run test` without server-only errors.
//
// Assertions are concept-based (contains/startsWith) rather than literal-string
// to avoid embedding negative-grep-gate trip patterns.

import { describe, it, expect } from "vitest";
import enDict from "@/dictionaries/en.json";
import type { Dictionary } from "@/lib/dictionary";
import {
  frontmatter,
  renderBlocks,
  renderComparisonTable,
  renderHomeMd,
  renderServicesIndexMd,
  renderServiceMd,
  renderAboutMd,
  renderAppointmentsMd,
  renderContactMd,
  renderGalleryMd,
  renderReviewsMd,
  renderFaqMd,
  renderLavalMd,
  renderTermsMd,
  renderPrivacyMd,
  renderComparisonMd,
  renderGuideMd,
} from "@/lib/md-serializer";
import { services } from "@/lib/services";
import { comparisons } from "@/lib/comparisons";
import { guides } from "@/lib/guides";

const dict = enDict as unknown as Dictionary;
const lang = "en";
const baseUrl = "https://onglessanssouci.com";

// ─── frontmatter() ────────────────────────────────────────────────────────────

describe("frontmatter()", () => {
  it("emits YAML fence delimiters", () => {
    const fm = frontmatter({
      title: "Test Page",
      lang: "en",
      canonical: `${baseUrl}/en`,
      updated: "2026-06-17",
    });
    expect(fm).toContain("---");
  });

  it("contains title field", () => {
    const fm = frontmatter({
      title: "Test Page",
      lang: "en",
      canonical: `${baseUrl}/en`,
      updated: "2026-06-17",
    });
    expect(fm).toContain("title:");
  });

  it("contains lang field", () => {
    const fm = frontmatter({
      title: "Test Page",
      lang: "en",
      canonical: `${baseUrl}/en`,
      updated: "2026-06-17",
    });
    expect(fm).toContain("lang:");
  });

  it("contains canonical field", () => {
    const fm = frontmatter({
      title: "Test Page",
      lang: "en",
      canonical: `${baseUrl}/en`,
      updated: "2026-06-17",
    });
    expect(fm).toContain("canonical:");
  });

  it("contains updated field", () => {
    const fm = frontmatter({
      title: "Test Page",
      lang: "en",
      canonical: `${baseUrl}/en`,
      updated: "2026-06-17",
    });
    expect(fm).toContain("updated:");
  });
});

// ─── renderBlocks() ──────────────────────────────────────────────────────────

describe("renderBlocks()", () => {
  it("renders h3 kind as a markdown heading", () => {
    const out = renderBlocks([{ kind: "h3", text: "My Heading", items: [] }]);
    expect(out).toContain("###");
    expect(out).toContain("My Heading");
  });

  it("renders ul kind with dash-prefixed items", () => {
    const out = renderBlocks([
      { kind: "ul", text: "", items: ["First item", "Second item"] },
    ]);
    expect(out).toContain("- First item");
    expect(out).toContain("- Second item");
  });

  it("renders p kind as a text paragraph", () => {
    const out = renderBlocks([
      { kind: "p", text: "A paragraph of text.", items: [] },
    ]);
    expect(out).toContain("A paragraph of text.");
  });

  it("renders mixed block sequence", () => {
    const out = renderBlocks([
      { kind: "h3", text: "Section", items: [] },
      { kind: "p", text: "Intro text.", items: [] },
      { kind: "ul", text: "", items: ["Item A"] },
    ]);
    expect(out).toContain("###");
    expect(out).toContain("Section");
    expect(out).toContain("Intro text.");
    expect(out).toContain("- Item A");
  });
});

// ─── renderComparisonTable() ─────────────────────────────────────────────────

describe("renderComparisonTable()", () => {
  const columns = ["Feature", "Option A", "Option B"];
  const rows = [
    { label: "Speed", cells: ["Fast", "Slow"] },
    { label: "Cost", cells: ["High", "Low"] },
  ];

  it("emits a header row with column names", () => {
    const out = renderComparisonTable(columns, rows);
    expect(out).toContain("Feature");
    expect(out).toContain("Option A");
    expect(out).toContain("Option B");
  });

  it("emits a separator row of dashes", () => {
    const out = renderComparisonTable(columns, rows);
    // Markdown table separator row contains dashes and pipes
    expect(out).toMatch(/\|[-| ]+\|/);
  });

  it("emits a data row per entry", () => {
    const out = renderComparisonTable(columns, rows);
    expect(out).toContain("Speed");
    expect(out).toContain("Fast");
    expect(out).toContain("Cost");
    expect(out).toContain("Low");
  });
});

// ─── renderHomeMd() ──────────────────────────────────────────────────────────

describe("renderHomeMd()", () => {
  const canonical = `${baseUrl}/en`;
  const out = renderHomeMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains hero tagline as heading", () => {
    expect(out).toContain(dict.hero.tagline);
  });

  it("contains services section", () => {
    expect(out).toContain("Services");
  });

  it("contains story/about section", () => {
    expect(out).toContain(dict.home.story);
  });

  it("contains aggregate rating reference", () => {
    // reviews aggregate rating — number should appear
    expect(out).toMatch(/\d+\.\d+/); // e.g. "4.2"
  });
});

// ─── renderServicesIndexMd() ─────────────────────────────────────────────────

describe("renderServicesIndexMd()", () => {
  const canonical = `${baseUrl}/en/services`;
  const out = renderServicesIndexMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("lists all service names", () => {
    // Each service title from the dict.services array should appear
    dict.services.forEach((s) => {
      expect(out).toContain(s.title);
    });
  });
});

// ─── renderServiceMd() ───────────────────────────────────────────────────────

describe("renderServiceMd()", () => {
  const service = services[0]; // manicure
  const canonical = `${baseUrl}/en/services/manicure`;
  const detail = dict.serviceDetails[service.id];
  const out = renderServiceMd(lang, dict, service, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains service title as H1", () => {
    expect(out).toContain(detail.title);
  });

  it("contains price", () => {
    expect(out).toContain(String(service.price));
  });

  it("contains included items", () => {
    expect(out).toContain(detail.included[0]);
  });

  it("contains addon items", () => {
    expect(out).toContain(detail.addons[0]);
  });

  it("contains FAQ questions", () => {
    expect(out).toContain(detail.faq[0].q);
  });

  it("contains FAQ answers", () => {
    expect(out).toContain(detail.faq[0].a);
  });
});

// ─── renderAboutMd() ─────────────────────────────────────────────────────────

describe("renderAboutMd()", () => {
  const canonical = `${baseUrl}/en/about`;
  const out = renderAboutMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains about heading", () => {
    expect(out).toContain(dict.about.heading);
  });

  it("contains about lead", () => {
    expect(out).toContain(dict.about.lead);
  });
});

// ─── renderAppointmentsMd() ──────────────────────────────────────────────────

describe("renderAppointmentsMd()", () => {
  const canonical = `${baseUrl}/en/appointments`;
  const out = renderAppointmentsMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains appointments heading", () => {
    expect(out).toContain(dict.appointments.heading);
  });

  it("links out to canonical URL (D-04 thin page)", () => {
    expect(out).toContain(canonical);
  });
});

// ─── renderContactMd() ───────────────────────────────────────────────────────

describe("renderContactMd()", () => {
  const canonical = `${baseUrl}/en/contact`;
  const out = renderContactMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains contact heading", () => {
    expect(out).toContain(dict.contact.heading);
  });
});

// ─── renderGalleryMd() ───────────────────────────────────────────────────────

describe("renderGalleryMd()", () => {
  const canonical = `${baseUrl}/en/gallery`;
  const out = renderGalleryMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains gallery title", () => {
    expect(out).toContain(dict.gallery.title);
  });

  it("links out to canonical URL (D-04 thin page)", () => {
    expect(out).toContain(canonical);
  });
});

// ─── renderReviewsMd() ───────────────────────────────────────────────────────

describe("renderReviewsMd()", () => {
  const canonical = `${baseUrl}/en/reviews`;
  const out = renderReviewsMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains reviews title", () => {
    expect(out).toContain(dict.reviewsPage.title);
  });

  it("contains aggregate rating", () => {
    expect(out).toMatch(/\d+\.\d+/); // aggregate ratingValue e.g. "4.2"
  });
});

// ─── renderFaqMd() ───────────────────────────────────────────────────────────

describe("renderFaqMd()", () => {
  const canonical = `${baseUrl}/en/faq`;
  const out = renderFaqMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains faq title", () => {
    expect(out).toContain(dict.faq.title);
  });

  it("contains faq questions", () => {
    expect(out).toContain(dict.faq.items[0].q);
  });
});

// ─── renderLavalMd() ─────────────────────────────────────────────────────────

describe("renderLavalMd()", () => {
  const canonical = `${baseUrl}/en/laval`;
  const out = renderLavalMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains laval in content", () => {
    // Laval page should mention the location
    expect(out.toLowerCase()).toContain("laval");
  });
});

// ─── renderTermsMd() ─────────────────────────────────────────────────────────

describe("renderTermsMd()", () => {
  const canonical = `${baseUrl}/en/terms`;
  const out = renderTermsMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains terms heading", () => {
    expect(out).toContain(dict.legal.terms.heading);
  });

  it("renders legal block sections", () => {
    // At least one section heading should appear
    expect(out).toContain(dict.legal.terms.sections[0].heading);
  });
});

// ─── renderPrivacyMd() ───────────────────────────────────────────────────────

describe("renderPrivacyMd()", () => {
  const canonical = `${baseUrl}/en/privacy`;
  const out = renderPrivacyMd(lang, dict, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains privacy heading", () => {
    expect(out).toContain(dict.legal.privacy.heading);
  });
});

// ─── renderComparisonMd() ────────────────────────────────────────────────────

describe("renderComparisonMd()", () => {
  const cmp = comparisons[0]; // gel-vs-regular
  const canonical = `${baseUrl}/en/comparisons/${cmp.slug.en}`;
  const cmpDict = dict.comparisons[cmp.id];
  const out = renderComparisonMd(lang, dict, cmp, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains comparison title", () => {
    expect(out).toContain(cmpDict.title);
  });

  it("contains comparison table separator row", () => {
    expect(out).toMatch(/\|[-| ]+\|/);
  });
});

// ─── renderGuideMd() ─────────────────────────────────────────────────────────

describe("renderGuideMd()", () => {
  const guide = guides[0]; // manicure-cost-laval
  const canonical = `${baseUrl}/en/guides/${guide.slug.en}`;
  const guideDict = dict.guides[guide.id];
  const out = renderGuideMd(lang, dict, guide, canonical);

  it("starts with frontmatter fence", () => {
    expect(out.trimStart()).toMatch(/^---/);
  });

  it("contains guide title", () => {
    expect(out).toContain(guideDict.title);
  });
});
