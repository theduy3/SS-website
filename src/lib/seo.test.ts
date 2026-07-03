// Tests for seo.ts builders — SCHEMA-03: AggregateRating gate.
//
// Asserts:
//   (a) organizationGraph omits aggregateRating when reviewsFetchedAt is falsy (SCHEMA-03)
//   (b) organizationGraph emits aggregateRating when reviewsFetchedAt is truthy (gate works both ways)
//
// The gate is implemented in seo.ts via the reviewsFetchedAt export from lib/reviews.ts.
// We mock it here to test both branches without touching real data.

import { describe, it, expect, vi, afterEach } from "vitest";

// We mock the reviews module to control the gate state.
vi.mock("@/lib/reviews", () => ({
  reviewsFetchedAt: null,
}));

import {
  organizationGraph,
  productGraph,
  articleGraph,
  reviewGraph,
} from "./seo";
import { site } from "@/lib/site";

describe("organizationGraph — AggregateRating gate (SCHEMA-03)", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("omits aggregateRating when reviewsFetchedAt is null (unfetched)", async () => {
    // reviewsFetchedAt is mocked as null (the default committed scaffold state)
    const graph = organizationGraph("en", {
      name: "Test Salon",
      description: "Test description",
    });

    const businessNode = (graph["@graph"] as Array<Record<string, unknown>>).find(
      (node) => node["@type"] === "NailSalon",
    );
    expect(businessNode).toBeDefined();
    expect(businessNode).not.toHaveProperty("aggregateRating");
  });
});

describe("organizationGraph — AggregateRating included when fetched (SCHEMA-03 gate both ways)", () => {
  it("includes aggregateRating when reviewsFetchedAt is a truthy ISO string", async () => {
    // Re-import with a non-null fetchedAt to test the truthy branch.
    vi.doMock("@/lib/reviews", () => ({
      reviewsFetchedAt: "2026-01-01T00:00:00Z",
    }));

    const { organizationGraph: orgGraph } = await import("./seo");
    const graph = orgGraph("en", {
      name: "Test Salon",
      description: "Test description",
    });

    const businessNode = (graph["@graph"] as Array<Record<string, unknown>>).find(
      (node) => node["@type"] === "NailSalon",
    );
    expect(businessNode).toBeDefined();
    expect(businessNode).toHaveProperty("aggregateRating");

    vi.resetModules();
  });
});

describe("productGraph", () => {
  it("emits a Product node with an @id-linked brand and absolute, locale-prefixed url", () => {
    const graph = productGraph("en", {
      name: "Gel vs Regular",
      description: "Which polish lasts longer?",
      path: "/comparisons/gel-vs-regular-manicure",
    });

    expect(graph["@context"]).toBe("https://schema.org");
    expect(graph["@type"]).toBe("Product");
    expect(graph.name).toBe("Gel vs Regular");
    expect(graph.description).toBe("Which polish lasts longer?");
    expect(graph.url).toBe(
      `${site.url}/en/comparisons/gel-vs-regular-manicure`,
    );
    // Brand is linked by @id to the single business node, never inlined.
    expect(graph.brand).toEqual({ "@id": `${site.url}/#business` });
  });
});

describe("articleGraph", () => {
  const options = {
    name: "Combien coûte une manucure à Laval ?",
    description: "Tarifs de manucure expliqués.",
    path: "/guides/cout-manucure-laval",
    datePublished: "2026-06-22",
    dateModified: "2026-06-22",
  };

  it("emits an Article node with inLanguage, headline, @id-linked publisher and absolute url", () => {
    const graph = articleGraph("fr", options);

    expect(graph["@context"]).toBe("https://schema.org");
    expect(graph["@type"]).toBe("Article");
    expect(graph.headline).toBe("Combien coûte une manucure à Laval ?");
    expect(graph.description).toBe("Tarifs de manucure expliqués.");
    expect(graph.url).toBe(`${site.url}/fr/guides/cout-manucure-laval`);
    expect(graph.publisher).toEqual({ "@id": `${site.url}/#business` });
    // inLanguage carries the locale so crawlers index the article per-language.
    expect(graph.inLanguage).toBe("fr");
  });

  it("emits datePublished, dateModified and an @id-linked author (GEO-G freshness/E-E-A-T signals)", () => {
    const graph = articleGraph("fr", options);

    expect(graph.datePublished).toBe("2026-06-22");
    expect(graph.dateModified).toBe("2026-06-22");
    // Author @id-links the existing business Organization node — one fact,
    // one place, same convention as publisher.
    expect(graph.author).toEqual({ "@id": `${site.url}/#business` });
  });
});

describe("reviewGraph — live-data gate (SCHEMA-03)", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("returns null when reviewsFetchedAt is falsy (the committed scaffold state)", () => {
    // Top-level mock sets reviewsFetchedAt: null → no self-authored rating.
    expect(reviewGraph("en")).toBeNull();
  });

  it("emits a Review node @id-linked to the business when reviewsFetchedAt is truthy", async () => {
    vi.doMock("@/lib/reviews", () => ({
      reviewsFetchedAt: "2026-01-01T00:00:00Z",
    }));

    const { reviewGraph: gatedReviewGraph } = await import("./seo");
    const graph = gatedReviewGraph("en");

    expect(graph).not.toBeNull();
    expect(graph!["@type"]).toBe("Review");
    expect(graph!.itemReviewed).toEqual({ "@id": `${site.url}/#business` });
    expect(graph!.reviewRating).toMatchObject({
      "@type": "Rating",
      ratingValue: site.reviews.ratingValue,
      bestRating: site.reviews.bestRating,
    });

    vi.resetModules();
  });
});
