import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { WidgetEmbed } from "./WidgetEmbed";

afterEach(cleanup);

// In jsdom the injected <script> never loads (no network/exec), so the element
// and its attributes are observable in the DOM while status stays "loading".
function injectedScript(src: string) {
  return document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
}

describe("WidgetEmbed storeAttr", () => {
  it("uses data-account-store when storeAttr is set (T2)", () => {
    const src = "https://example.test/account.js";
    render(
      <WidgetEmbed
        src={src}
        store="SS"
        storeAttr="data-account-store"
        fallbackLabel="client portal"
      />,
    );
    const script = injectedScript(src);
    expect(script).not.toBeNull();
    expect(script!.getAttribute("data-account-store")).toBe("SS");
    expect(script!.getAttribute("data-store")).toBeNull();
  });

  it("defaults to data-store when storeAttr omitted (T3 regression)", () => {
    const src = "https://example.test/checkin.js";
    render(<WidgetEmbed src={src} store="SS" fallbackLabel="check-in" />);
    const script = injectedScript(src);
    expect(script).not.toBeNull();
    expect(script!.getAttribute("data-store")).toBe("SS");
    expect(script!.getAttribute("data-account-store")).toBeNull();
  });

  it("shows the loading overlay before the script loads (T5)", () => {
    render(
      <WidgetEmbed
        src="https://example.test/loading.js"
        store="SS"
        fallbackLabel="check-in"
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
