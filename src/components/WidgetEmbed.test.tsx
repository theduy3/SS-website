import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, act } from "@testing-library/react";
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

describe("WidgetEmbed theme", () => {
  it("renders a dark loading overlay for theme=dark (T1)", () => {
    render(
      <WidgetEmbed
        src="https://example.test/q.js"
        store="SS"
        fallbackLabel="queue"
        theme="dark"
      />,
    );
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("border-mocha");
    expect(spinner.className).toContain("border-t-cream");
    expect(spinner.parentElement!.className).toContain("bg-[#0b1220]");
  });

  it("renders a light loading overlay by default (T2)", () => {
    render(
      <WidgetEmbed
        src="https://example.test/c.js"
        store="SS"
        fallbackLabel="check-in"
      />,
    );
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("border-tan");
    expect(spinner.parentElement!.className).toContain("bg-fog");
  });

  it("collapses height when the dark widget is ready (T4)", () => {
    const src = "https://example.test/queue-ready.js";
    const { container } = render(
      <WidgetEmbed src={src} store="SS" fallbackLabel="queue" theme="dark" />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-screen");
    const script = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    )!;
    act(() => {
      script.onload!(new Event("load"));
    });
    expect(wrapper.className).not.toContain("min-h-screen");
  });

  it("keeps full height when a light widget is ready", () => {
    const src = "https://example.test/checkin-ready.js";
    const { container } = render(
      <WidgetEmbed src={src} store="SS" fallbackLabel="check-in" />,
    );
    const script = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    )!;
    act(() => {
      script.onload!(new Event("load"));
    });
    expect((container.firstChild as HTMLElement).className).toContain(
      "min-h-screen",
    );
  });
});
