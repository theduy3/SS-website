import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { QueueWidget } from "./QueueWidget";

afterEach(cleanup);

describe("QueueWidget", () => {
  it("renders the dark overlay (theme=dark wired through) (T5)", () => {
    render(<QueueWidget />);
    const spinner = screen.getByRole("status");
    expect(spinner.parentElement!.className).toContain("bg-[#0b1220]");
  });
});
