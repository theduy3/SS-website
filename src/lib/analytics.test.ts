// Unit tests for analytics helpers (03-01, MEAS-01).
// RED phase: these tests describe the expected behaviour of track() and
// grantConsent() before implementation exists. They MUST fail on the first run.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Import after each test re-requires to get a fresh module state.
// We use vi.stubGlobal to control window.gtag across cases.

describe("track()", () => {
  beforeEach(() => {
    // Reset any gtag stub between tests.
    vi.stubGlobal("gtag", undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no-ops when window.gtag is undefined — does not throw", async () => {
    const { track } = await import("./analytics");
    expect(() => track("phone_click")).not.toThrow();
  });

  it("calls window.gtag('event', ...) when gtag is defined", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    const { track } = await import("./analytics");
    track("generate_lead", { method: "contact_form" });
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", {
      method: "contact_form",
    });
  });

  it("calls window.gtag with only the event name when no params supplied", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    const { track } = await import("./analytics");
    track("phone_click");
    expect(gtag).toHaveBeenCalledWith("event", "phone_click", undefined);
  });
});

describe("grantConsent()", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no-ops when window.gtag is undefined — does not throw", async () => {
    vi.stubGlobal("gtag", undefined);
    const { grantConsent } = await import("./analytics");
    expect(() => grantConsent()).not.toThrow();
  });

  it("calls gtag('consent','update',{analytics_storage:'granted'}) when gtag is defined", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    const { grantConsent } = await import("./analytics");
    grantConsent();
    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "granted",
    });
  });
});
