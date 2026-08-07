import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { site } from "@/lib/site";
import { track } from "@/lib/analytics";
import { SS_CONSENT_CHANGED_EVENT } from "@/lib/consent";
import { StickyCtaBar } from "./StickyCtaBar";

const pathname = vi.hoisted(() => ({ value: "/en/about" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

afterEach(() => {
  pathname.value = "/en/about";
  vi.clearAllMocks();
});

const dict = {
  cta: {
    book: "Book now",
    callNow: "Call now",
    directions: "Directions",
  },
} as Parameters<typeof StickyCtaBar>[0]["dict"];

function clickLink(link: HTMLElement) {
  const defaultPrevented: boolean[] = [];
  document.addEventListener(
    "click",
    (event) => {
      defaultPrevented.push(event.defaultPrevented);
      event.preventDefault();
    },
    { once: true },
  );

  fireEvent.click(link);
  expect(defaultPrevented).toEqual([false]);
}

describe("StickyCtaBar", () => {
  it("renders nothing before consent is known", () => {
    const { container } = render(
      <StickyCtaBar locale="en" dict={dict} consentKnown={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders Call, Book, and Directions with their intended destinations", () => {
    render(<StickyCtaBar locale="en" dict={dict} consentKnown />);

    expect(
      screen.getByRole("navigation", { name: "Quick contact" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Call now" })).toHaveAttribute(
      "href",
      site.contact.phoneHref,
    );
    expect(screen.getByRole("link", { name: "Call now" })).not.toHaveAttribute(
      "target",
    );
    expect(screen.getByRole("link", { name: "Book now" })).toHaveAttribute(
      "href",
      "/en/appointments",
    );
    expect(screen.getByRole("link", { name: "Book now" })).not.toHaveAttribute(
      "target",
    );
    expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute(
      "href",
      site.contact.directionsHref,
    );
    expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  it("hides the bar and spacer on the localized booking path", () => {
    pathname.value = "/en/appointments/";
    const { container } = render(
      <StickyCtaBar locale="en" dict={dict} consentKnown />,
    );
    expect(container.firstChild).toBeNull();
    pathname.value = "/en/about";
  });

  it("reveals immediately after the consent event", async () => {
    render(<StickyCtaBar locale="en" dict={dict} consentKnown={false} />);
    expect(screen.queryByRole("navigation", { name: "Quick contact" })).toBeNull();

    act(() => window.dispatchEvent(new Event(SS_CONSENT_CHANGED_EVENT)));

    expect(
      await screen.findByRole("navigation", { name: "Quick contact" }),
    ).toBeTruthy();
  });

  it("tracks clicks without preventing link navigation", () => {
    render(<StickyCtaBar locale="en" dict={dict} consentKnown />);

    clickLink(screen.getByRole("link", { name: "Call now" }));
    expect(track).toHaveBeenCalledWith("phone_click");

    clickLink(screen.getByRole("link", { name: "Book now" }));
    expect(track).toHaveBeenCalledWith("book_cta_click");

    clickLink(screen.getByRole("link", { name: "Directions" }));
    expect(track).toHaveBeenCalledWith("directions_click");
  });

  it("marks each rendered icon svg as aria-hidden", () => {
    const { container } = render(
      <StickyCtaBar locale="en" dict={dict} consentKnown />,
    );

    const icons = container.querySelectorAll("svg");
    expect(icons).toHaveLength(3);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("stroke", "currentColor");
      expect(icon).toHaveAttribute("stroke-width");
    });
  });

  it("uses RTL row direction while keeping Book between Call and Directions in the DOM", () => {
    render(<StickyCtaBar locale="ar" dict={dict} consentKnown />);

    const nav = screen.getByRole("navigation", { name: "Quick contact" });
    expect(nav.firstElementChild).toHaveClass("flex-row-reverse");
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Call now",
      "Book now",
      "Directions",
    ]);
  });
});
