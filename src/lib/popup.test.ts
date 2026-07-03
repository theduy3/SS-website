// Unit tests for the pure popup-selection seam in popup.ts: which popups are
// active for a given instant, in what order, and how localized text falls back.
// The per-visitor frequency/seen check lives client-side (popup-frequency.ts) —
// this file covers only the pure, server-shared selection logic.

import { describe, it, expect } from "vitest";
import { PopupSchema, pickActiveSorted, pickActive, pickText } from "./popup";
import type { Popup } from "./popup";

// Build a valid rich Popup via the schema so defaults (version, image, cta…)
// are filled; override only the fields the selection logic reads.
function mk(
  id: string,
  over: { priority?: number; startsAt?: string | null; endsAt?: string | null } = {},
): Popup {
  return PopupSchema.parse({
    type: "rich",
    id,
    title: { en: id, fr: id },
    body: { en: id, fr: id },
    ...over,
  });
}

const now = new Date("2026-07-02T12:00:00Z");

describe("pickActiveSorted", () => {
  it("keeps popups whose [startsAt, endsAt] window contains now", () => {
    const past = mk("past", { endsAt: "2026-07-01T00:00:00Z" });
    const future = mk("future", { startsAt: "2026-07-03T00:00:00Z" });
    const live = mk("live", {
      startsAt: "2026-07-01T00:00:00Z",
      endsAt: "2026-07-03T00:00:00Z",
    });
    expect(pickActiveSorted([past, future, live], now).map((p) => p.id)).toEqual([
      "live",
    ]);
  });

  it("treats null bounds as unbounded on that side", () => {
    const noStart = mk("noStart", { endsAt: "2026-07-03T00:00:00Z" });
    const noEnd = mk("noEnd", { startsAt: "2026-07-01T00:00:00Z" });
    const both = mk("both");
    expect(
      pickActiveSorted([noStart, noEnd, both], now).map((p) => p.id).sort(),
    ).toEqual(["both", "noEnd", "noStart"]);
  });

  it("orders by priority desc, breaking ties by id for determinism", () => {
    const a = mk("a", { priority: 1 });
    const b = mk("b", { priority: 5 });
    const c = mk("c", { priority: 5 });
    expect(pickActiveSorted([a, b, c], now).map((p) => p.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = [mk("a", { priority: 1 }), mk("b", { priority: 5 })];
    const order = input.map((p) => p.id);
    pickActiveSorted(input, now);
    expect(input.map((p) => p.id)).toEqual(order);
  });
});

describe("pickActive", () => {
  it("returns the highest-priority active popup", () => {
    expect(
      pickActive([mk("a", { priority: 1 }), mk("b", { priority: 5 })], now)?.id,
    ).toBe("b");
  });

  it("returns null when none are active", () => {
    const past = mk("past", { endsAt: "2026-07-01T00:00:00Z" });
    expect(pickActive([past], now)).toBeNull();
  });
});

describe("pickText", () => {
  it("returns the requested locale when present", () => {
    expect(pickText({ en: "hello", fr: "bonjour" }, "en")).toBe("hello");
  });

  it("falls back to the default locale (fr) when the request is missing", () => {
    expect(pickText({ fr: "bonjour", en: "hello" }, "es")).toBe("bonjour");
  });

  it("falls back to en when neither request nor fr is present", () => {
    expect(pickText({ en: "hello" }, "ar")).toBe("hello");
  });

  it("returns empty string when no usable text exists", () => {
    expect(pickText({}, "en")).toBe("");
  });

  it("treats an empty string as absent and keeps falling back", () => {
    expect(pickText({ es: "", fr: "bonjour" }, "es")).toBe("bonjour");
  });
});
