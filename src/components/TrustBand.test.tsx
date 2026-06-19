// Unit tests for TrustBand (03-02, MEAS-02/03).
//
// Asserts:
//   (a) When reviewsFetchedAt is truthy (live data present):
//       - Renders the rating number, reviewsWord, and established string.
//   (b) When reviewsFetchedAt is null (no live fetch yet):
//       - Renders the established string only (no rating, no reviewsWord).
//
// Mocks:
//   - @/lib/reviews  (reviewsFetchedAt — toggled per test group)
//   - @/lib/site     (site.reviews.ratingValue / reviewCount)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrustBand } from "./TrustBand";
import type { Dictionary } from "@/lib/dictionary";

// Minimal dict subset TrustBand needs.
const dict = {
  trust: {
    established: "Since 2024",
    reviewsWord: "Google reviews",
  },
} as Pick<Dictionary, "trust">;

// Mock @/lib/site so we control the rating values.
vi.mock("@/lib/site", () => ({
  site: {
    reviews: {
      ratingValue: 4.2,
      reviewCount: 127,
      bestRating: 5,
    },
    // Other site fields not used by TrustBand — kept empty.
  },
}));

// Mock @/lib/reviews — reviewsFetchedAt is set per describe block below.
vi.mock("@/lib/reviews", () => ({
  reviewsFetchedAt: null as string | null,
}));

import * as reviews from "@/lib/reviews";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TrustBand — live data present (reviewsFetchedAt truthy)", () => {
  beforeEach(() => {
    // Simulate a live fetch: set a non-null timestamp.
    (reviews as { reviewsFetchedAt: string | null }).reviewsFetchedAt =
      "2026-06-18T00:00:00Z";
  });

  it("renders the rating number", () => {
    render(<TrustBand locale="en" dict={dict} />);
    // Rating 4.2 formatted as "4.2" in en-CA locale.
    expect(screen.getByText(/4[.,]2/)).toBeTruthy();
  });

  it("renders the reviewsWord", () => {
    render(<TrustBand locale="en" dict={dict} />);
    expect(screen.getByText(/Google reviews/i)).toBeTruthy();
  });

  it("renders the established string", () => {
    render(<TrustBand locale="en" dict={dict} />);
    expect(screen.getByText("Since 2024")).toBeTruthy();
  });
});

describe("TrustBand — no live data (reviewsFetchedAt null)", () => {
  beforeEach(() => {
    (reviews as { reviewsFetchedAt: string | null }).reviewsFetchedAt = null;
  });

  it("renders the established string", () => {
    render(<TrustBand locale="en" dict={dict} />);
    expect(screen.getByText("Since 2024")).toBeTruthy();
  });

  it("does NOT render any rating text (no placeholder)", () => {
    render(<TrustBand locale="en" dict={dict} />);
    // No number matching a rating pattern should appear.
    expect(screen.queryByText(/4[.,][0-9]/)).toBeNull();
  });

  it("does NOT render the reviewsWord", () => {
    render(<TrustBand locale="en" dict={dict} />);
    expect(screen.queryByText(/Google reviews/i)).toBeNull();
  });
});
