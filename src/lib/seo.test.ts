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

import { organizationGraph } from "./seo";

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
