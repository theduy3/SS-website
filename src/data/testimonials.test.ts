import { describe, expect, it } from "vitest";
import { reviews } from "@/lib/reviews";
import { testimonials } from "./testimonials";

describe("testimonial content", () => {
  it("only exposes verified review bodies", () => {
    expect(testimonials.length).toBeLessThanOrEqual(6);
    expect(testimonials.every((testimonial) => testimonial.quote.trim().length > 0)).toBe(true);
    expect(
      testimonials.every((testimonial) => reviews.some((review) => review.text === testimonial.quote)),
    ).toBe(true);
  });
});
