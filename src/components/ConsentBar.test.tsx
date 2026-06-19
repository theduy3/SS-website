// Unit tests for ConsentBar (03-01, MEAS-01).
// Covers the five behaviours from the plan <behavior> block.
//
// Mocks:
//   - @/lib/analytics (grantConsent)
//   - @/lib/consent  (writeConsent)
//   - useSyncExternalStore is real — but we force the "hydrated" snapshot
//     by mocking the module in the hydrated tests.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock the helpers so we can spy without touching document.cookie / window.gtag.
vi.mock("@/lib/analytics", () => ({ grantConsent: vi.fn() }));
vi.mock("@/lib/consent", () => ({
  writeConsent: vi.fn(),
  SS_CONSENT_COOKIE: "ss_consent",
}));

// For hydration-gate tests we need to control useSyncExternalStore.
// React's real implementation reads the server/client snapshots differently.
// We intercept the React module to force the client snapshot.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useSyncExternalStore: (
      _subscribe: unknown,
      getSnapshot: () => unknown,
      _getServerSnapshot?: () => unknown,
    ) => getSnapshot(),
  };
});

import { grantConsent } from "@/lib/analytics";
import { writeConsent } from "@/lib/consent";
import { ConsentBar } from "./ConsentBar";

// Minimal dict subset ConsentBar actually uses.
const dict = {
  consent: {
    body: "We use analytics cookies.",
    accept: "Accept",
    decline: "Decline",
    ariaLabel: "Cookie consent",
  },
} as Parameters<typeof ConsentBar>[0]["dict"];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ConsentBar", () => {
  it("renders nothing when consentKnown=true (cookie already set)", () => {
    const { container } = render(
      <ConsentBar dict={dict} locale="en" consentKnown={true} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the bar (Accept + Decline buttons) when hydrated and consentKnown=false", () => {
    render(<ConsentBar dict={dict} locale="en" consentKnown={false} />);
    expect(screen.getByText("Accept")).toBeTruthy();
    expect(screen.getByText("Decline")).toBeTruthy();
  });

  it("Accept: calls writeConsent('granted') and grantConsent(), then unmounts bar", () => {
    render(<ConsentBar dict={dict} locale="en" consentKnown={false} />);
    fireEvent.click(screen.getByText("Accept"));
    expect(writeConsent).toHaveBeenCalledWith("granted");
    expect(grantConsent).toHaveBeenCalledTimes(1);
    // Bar should unmount — buttons gone
    expect(screen.queryByText("Accept")).toBeNull();
  });

  it("Decline: calls writeConsent('denied'), does NOT call grantConsent(), then unmounts bar", () => {
    render(<ConsentBar dict={dict} locale="en" consentKnown={false} />);
    fireEvent.click(screen.getByText("Decline"));
    expect(writeConsent).toHaveBeenCalledWith("denied");
    expect(grantConsent).not.toHaveBeenCalled();
    // Bar should unmount — buttons gone
    expect(screen.queryByText("Decline")).toBeNull();
  });

  it("uses native <button type='button'> elements (not Button component)", () => {
    render(<ConsentBar dict={dict} locale="en" consentKnown={false} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    buttons.forEach((btn) => {
      expect(btn.tagName).toBe("BUTTON");
      expect(btn.getAttribute("type")).toBe("button");
    });
  });
});
