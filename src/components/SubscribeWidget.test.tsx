import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SubscribeWidget } from "./SubscribeWidget";

afterEach(cleanup);

const SRC = "https://app.onglessanssouci.com/widgets/subscribe-widget.js";

describe("SubscribeWidget", () => {
  it("injects the subscribe script with data-subscribe-store=SS (T1, T2)", () => {
    render(<SubscribeWidget />);
    const script = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    expect(script).not.toBeNull();
    expect(script!.getAttribute("data-subscribe-store")).toBe("SS");
  });
});
