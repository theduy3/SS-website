import { describe, it, expect } from "vitest";
import { metadata } from "./layout";

describe("subscription layout metadata", () => {
  it("is noindex / nofollow (T4)", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("has the Subscribe title", () => {
    expect(metadata.title).toBe("Subscribe");
  });
});
