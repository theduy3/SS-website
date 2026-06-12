import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ClientPortalWidget } from "./ClientPortalWidget";

afterEach(cleanup);

const SRC = "https://app.onglessanssouci.com/widgets/client-account-widget.js";

describe("ClientPortalWidget", () => {
  it("injects the client-account script with data-account-store=SS (T1, T2)", () => {
    render(<ClientPortalWidget />);
    const script = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    expect(script).not.toBeNull();
    expect(script!.getAttribute("data-account-store")).toBe("SS");
  });
});
