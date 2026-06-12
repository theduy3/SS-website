import { describe, it, expect } from "vitest";
import { metadata } from "./layout";

describe("clientportal layout metadata", () => {
  it("is noindex / nofollow (T4)", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("has the Account title", () => {
    expect(metadata.title).toBe("Account");
  });
});
