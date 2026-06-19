// Unit tests for analytics helpers (03-01, MEAS-01).
// Updated to cover consent-gated behaviour (CR-01) and the manual page_view
// fired in grantConsent() (CR-02).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Import after each test re-requires to get a fresh module state.
// We use vi.stubGlobal to control window.gtag across cases.

// ---------------------------------------------------------------------------
// Cookie helpers — set / clear document.cookie for the consent cookie
// ---------------------------------------------------------------------------
const SS_CONSENT_COOKIE = "ss_consent";

function setConsentCookie(value: string) {
  Object.defineProperty(document, "cookie", {
    writable: true,
    configurable: true,
    value: `${SS_CONSENT_COOKIE}=${value}`,
  });
}

function clearConsentCookie() {
  Object.defineProperty(document, "cookie", {
    writable: true,
    configurable: true,
    value: "",
  });
}

// ---------------------------------------------------------------------------
// track()
// ---------------------------------------------------------------------------

describe("track()", () => {
  beforeEach(() => {
    vi.stubGlobal("gtag", undefined);
    clearConsentCookie();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    clearConsentCookie();
  });

  it("no-ops when window.gtag is undefined — does not throw", async () => {
    const { track } = await import("./analytics");
    expect(() => track("phone_click")).not.toThrow();
  });

  it("no-ops when consent cookie is absent — gtag is NOT called", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    // cookie is empty (clearConsentCookie above)
    const { track } = await import("./analytics");
    track("generate_lead", { method: "contact_form" });
    expect(gtag).not.toHaveBeenCalled();
  });

  it("no-ops when consent is denied — gtag is NOT called", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    setConsentCookie("denied");
    const { track } = await import("./analytics");
    track("phone_click");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("no-ops when consent cookie has an unexpected value", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    setConsentCookie("anything-else");
    const { track } = await import("./analytics");
    track("book_cta_click");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("calls window.gtag('event', ...) when consent is granted", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    setConsentCookie("granted");
    const { track } = await import("./analytics");
    track("generate_lead", { method: "contact_form" });
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", {
      method: "contact_form",
    });
  });

  it("calls window.gtag with only the event name when no params supplied (consent granted)", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    setConsentCookie("granted");
    const { track } = await import("./analytics");
    track("phone_click");
    expect(gtag).toHaveBeenCalledWith("event", "phone_click", undefined);
  });
});

// ---------------------------------------------------------------------------
// grantConsent()
// ---------------------------------------------------------------------------

describe("grantConsent()", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearConsentCookie();
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

  it("fires a manual page_view event after updating consent (CR-02)", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    const { grantConsent } = await import("./analytics");
    grantConsent();
    // Should have been called twice: consent update + page_view
    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag).toHaveBeenNthCalledWith(1, "consent", "update", {
      analytics_storage: "granted",
    });
    expect(gtag).toHaveBeenNthCalledWith(2, "event", "page_view");
  });

  it("subsequent track() calls succeed after grantConsent() sets the cookie", async () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    // Simulate what ConsentBar does: write the cookie then call grantConsent()
    setConsentCookie("granted");
    const { grantConsent, track } = await import("./analytics");
    grantConsent();
    // Clear gtag call count from grantConsent
    gtag.mockClear();
    track("phone_click");
    expect(gtag).toHaveBeenCalledWith("event", "phone_click", undefined);
  });
});
