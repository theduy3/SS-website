// Unit tests for WebVitalsReporter (03-03, MEAS-04).
// Covers consent-gate behaviour: no listeners / no track when consentGranted=false,
// listeners registered and track called when consentGranted=true.
//
// Mocks:
//   - web-vitals (onLCP, onINP, onCLS)
//   - @/lib/analytics (track)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";

// Mock web-vitals so we can capture registered callbacks without a real browser.
const mockOnLCP = vi.fn();
const mockOnINP = vi.fn();
const mockOnCLS = vi.fn();

vi.mock("web-vitals", () => ({
  onLCP: mockOnLCP,
  onINP: mockOnINP,
  onCLS: mockOnCLS,
}));

// Mock track to spy on calls without touching window.gtag.
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { track } from "@/lib/analytics";
import { WebVitalsReporter } from "./WebVitalsReporter";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("WebVitalsReporter", () => {
  it("renders null (no DOM output)", () => {
    const { container } = render(
      <WebVitalsReporter consentGranted={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("does NOT register any web-vitals listeners when consentGranted=false", () => {
    render(<WebVitalsReporter consentGranted={false} />);
    expect(mockOnLCP).not.toHaveBeenCalled();
    expect(mockOnINP).not.toHaveBeenCalled();
    expect(mockOnCLS).not.toHaveBeenCalled();
  });

  it("does NOT call track when consentGranted=false", () => {
    render(<WebVitalsReporter consentGranted={false} />);
    expect(track).not.toHaveBeenCalled();
  });

  it("registers onLCP, onINP, onCLS when consentGranted=true", () => {
    render(<WebVitalsReporter consentGranted={true} />);
    expect(mockOnLCP).toHaveBeenCalledTimes(1);
    expect(mockOnINP).toHaveBeenCalledTimes(1);
    expect(mockOnCLS).toHaveBeenCalledTimes(1);
  });

  it("calls track('web_vitals', ...) with correct shape when a metric fires (LCP example)", () => {
    render(<WebVitalsReporter consentGranted={true} />);

    // Grab the callback registered with onLCP and simulate a metric report.
    const lcpCallback = mockOnLCP.mock.calls[0][0];
    act(() => {
      lcpCallback({
        name: "LCP",
        value: 1234.56,
        rating: "good",
        id: "v3-1234",
      });
    });

    expect(track).toHaveBeenCalledWith("web_vitals", {
      metric_name: "LCP",
      value: 1235, // Math.round(1234.56)
      metric_rating: "good",
      metric_id: "v3-1234",
    });
  });

  it("calls track for CLS metric with correct shape", () => {
    render(<WebVitalsReporter consentGranted={true} />);

    const clsCallback = mockOnCLS.mock.calls[0][0];
    act(() => {
      clsCallback({
        name: "CLS",
        value: 0.05,
        rating: "good",
        id: "v3-cls-1",
      });
    });

    expect(track).toHaveBeenCalledWith("web_vitals", {
      metric_name: "CLS",
      value: 0, // Math.round(0.05)
      metric_rating: "good",
      metric_id: "v3-cls-1",
    });
  });
});
