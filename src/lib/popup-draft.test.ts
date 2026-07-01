// Tests for the draft<->schema conversion seam behind the admin popup form.
// A prior bug (b759ed6) shipped because startsAt/endsAt were passed straight
// through instead of bridging <input type="datetime-local"> and UTC ISO — these
// tests lock the round-trip so that regression can't recur silently. Assertions
// avoid hardcoded UTC offsets: isoToDatetimeLocal/datetimeLocalToISO are defined
// in terms of the host's local timezone, so expectations are built from local
// Date components rather than a fixed instant, keeping the suite host-TZ-agnostic.

import { describe, it, expect } from "vitest";
import {
  isoToDatetimeLocal,
  datetimeLocalToISO,
  emptyDraft,
  toDraft,
  toPopup,
} from "./popup-draft";
import type { Popup } from "./popup";

describe("isoToDatetimeLocal", () => {
  it("returns empty string for null, undefined, or an unparseable value", () => {
    expect(isoToDatetimeLocal(null)).toBe("");
    expect(isoToDatetimeLocal(undefined)).toBe("");
    expect(isoToDatetimeLocal("not-a-date")).toBe("");
  });

  it("formats as local YYYY-MM-DDTHH:mm with zero-padding", () => {
    const iso = new Date(2026, 0, 5, 9, 5).toISOString(); // Jan 5 2026, 09:05 local
    expect(isoToDatetimeLocal(iso)).toBe("2026-01-05T09:05");
  });
});

describe("datetimeLocalToISO", () => {
  it("returns null for empty, whitespace-only, or an unparseable value", () => {
    expect(datetimeLocalToISO("")).toBeNull();
    expect(datetimeLocalToISO("   ")).toBeNull();
    expect(datetimeLocalToISO("not-a-date")).toBeNull();
  });

  it("interprets the value as local wall-clock time", () => {
    const local = "2026-01-05T09:05";
    const expected = new Date(2026, 0, 5, 9, 5).toISOString();
    expect(datetimeLocalToISO(local)).toBe(expected);
  });
});

describe("isoToDatetimeLocal / datetimeLocalToISO round-trip", () => {
  it("preserves the instant when the source has zero seconds", () => {
    const original = new Date(2026, 5, 15, 23, 47); // seconds default to 0
    const iso = original.toISOString();
    expect(datetimeLocalToISO(isoToDatetimeLocal(iso))).toBe(iso);
  });

  it("truncates seconds by design — datetime-local has no seconds field", () => {
    const withSeconds = new Date(2026, 5, 15, 23, 47, 30).toISOString();
    const roundTripped = datetimeLocalToISO(isoToDatetimeLocal(withSeconds))!;
    expect(roundTripped).not.toBe(withSeconds);
    expect(new Date(roundTripped).getSeconds()).toBe(0);
  });

  it("round-trips a datetime-local value through ISO and back unchanged", () => {
    const local = "2026-11-30T00:15";
    expect(isoToDatetimeLocal(datetimeLocalToISO(local)!)).toBe(local);
  });
});

describe("toDraft / toPopup", () => {
  const richPopup: Popup = {
    id: "welcome-banner",
    version: 2,
    priority: 5,
    startsAt: null,
    endsAt: null,
    frequency: "session",
    type: "rich",
    image: { url: "https://example.com/a.png", alt: "Alt" },
    title: { en: "Hi", fr: "Salut" },
    body: { en: "Body", fr: "Corps" },
    cta: { label: { en: "Book", fr: "Réserver" }, href: "/appointments" },
  };

  it("toDraft fills all four locales, defaulting missing es/ar to empty", () => {
    const draft = toDraft(richPopup);
    expect(draft.title).toEqual({ en: "Hi", fr: "Salut", es: "", ar: "" });
    expect(draft.ctaHref).toBe("/appointments");
    expect(draft.imageUrl).toBe("https://example.com/a.png");
  });

  it("toDraft maps an embed popup without touching rich-only fields", () => {
    const embed: Popup = {
      id: "promo",
      version: 1,
      priority: 0,
      startsAt: null,
      endsAt: null,
      frequency: "always",
      type: "embed",
      html: "<div>promo</div>",
    };
    const draft = toDraft(embed);
    expect(draft.html).toBe("<div>promo</div>");
    expect(draft.title).toEqual(emptyDraft().title);
  });

  it("toPopup keeps en/fr always, and only includes es/ar when non-empty", () => {
    const draft = toDraft(richPopup);
    draft.title.es = "   "; // whitespace-only must be trimmed and omitted
    draft.title.ar = "مرحبا";
    const popup = toPopup(draft) as Extract<Popup, { type: "rich" }>;
    expect(popup.title).toEqual({ en: "Hi", fr: "Salut", ar: "مرحبا" });
    expect(popup.title).not.toHaveProperty("es");
  });

  it("toPopup nulls image/cta when their fields are cleared", () => {
    const draft = toDraft(richPopup);
    draft.imageUrl = "";
    draft.ctaHref = "";
    const popup = toPopup(draft) as Extract<Popup, { type: "rich" }>;
    expect(popup.image).toBeNull();
    expect(popup.cta).toBeNull();
  });

  it("toPopup trims the id", () => {
    const draft = { ...toDraft(richPopup), id: "  padded-id  " };
    expect(toPopup(draft).id).toBe("padded-id");
  });

  it("toPopup builds a minimal embed popup", () => {
    const draft = { ...emptyDraft(), id: "x", type: "embed" as const, html: "<p>hi</p>" };
    expect(toPopup(draft)).toMatchObject({ id: "x", type: "embed", html: "<p>hi</p>" });
  });
});
