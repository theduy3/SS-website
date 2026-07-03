// Tests for the per-visitor frequency/seen seam. Runs in the default jsdom env,
// so local/sessionStorage are real; the daily window is exercised with fake
// timers. These pin the storage-degrade branch and the store/window semantics
// that were previously locked inside the PopupHost client component.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PopupSchema, type Popup } from "./popup";
import { seenKey, shouldShow, markSeen } from "./popup-frequency";

function mk(id: string, frequency: Popup["frequency"], version = 0): Popup {
  return PopupSchema.parse({
    type: "rich",
    id,
    version,
    frequency,
    title: { en: id, fr: id },
    body: { en: id, fr: id },
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("seenKey", () => {
  it("keys on id and version so a re-published popup is a new key", () => {
    expect(seenKey(mk("promo", "once", 0))).toBe("popup:promo:0");
    expect(seenKey(mk("promo", "once", 2))).toBe("popup:promo:2");
  });
});

describe("shouldShow / markSeen", () => {
  it("always: shows every time and records nothing", () => {
    const p = mk("a", "always");
    expect(shouldShow(p)).toBe(true);
    markSeen(p);
    expect(shouldShow(p)).toBe(true);
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });

  it("once: shows, then is suppressed via localStorage", () => {
    const p = mk("b", "once");
    expect(shouldShow(p)).toBe(true);
    markSeen(p);
    expect(shouldShow(p)).toBe(false);
    expect(localStorage.getItem(seenKey(p))).toBe("1");
  });

  it("session: records in sessionStorage, not localStorage", () => {
    const p = mk("c", "session");
    markSeen(p);
    expect(shouldShow(p)).toBe(false);
    expect(sessionStorage.getItem(seenKey(p))).toBe("1");
    expect(localStorage.getItem(seenKey(p))).toBeNull();
  });

  describe("daily", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("suppresses within the 24h window and shows again after it", () => {
      vi.setSystemTime(new Date("2026-07-02T12:00:00Z"));
      const p = mk("d", "daily");
      expect(shouldShow(p)).toBe(true);
      markSeen(p);
      expect(shouldShow(p)).toBe(false);

      vi.setSystemTime(new Date("2026-07-03T11:00:00Z")); // 23h later
      expect(shouldShow(p)).toBe(false);

      vi.setSystemTime(new Date("2026-07-03T13:00:00Z")); // 25h later
      expect(shouldShow(p)).toBe(true);
    });
  });

  it("degrades to showing once when storage access throws", () => {
    const p = mk("e", "once");
    const spy = vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    try {
      expect(shouldShow(p)).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});
