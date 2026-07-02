// Unit tests for the shared key-content-page blocks (Faq / BookCta /
// BackToServices / RelatedServiceLink) extracted from the service / guide /
// comparison pages. These are the single owners of markup those three pages
// rendered verbatim.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Dictionary } from "@/lib/dictionary";
import { site } from "@/lib/site";
import { services, serviceById, servicePath } from "@/lib/services";
import { Faq } from "./Faq";
import { BookCta } from "./BookCta";
import { BackToServices } from "./BackToServices";
import { RelatedServiceLink } from "./RelatedServiceLink";

describe("Faq", () => {
  const items = [
    { q: "How long does it take?", a: "About an hour." },
    { q: "Do I need to book?", a: "Walk-ins welcome." },
  ];

  it("renders the heading and every Q&A pair", () => {
    render(<Faq heading="Questions" items={items} />);
    expect(screen.getByRole("heading", { name: "Questions" })).toBeTruthy();
    for (const { q, a } of items) {
      expect(screen.getByText(q)).toBeTruthy();
      expect(screen.getByText(a)).toBeTruthy();
    }
  });
});

describe("BookCta", () => {
  const dict = {
    reviews: { ctaPrompt: "Ready to book?" },
    cta: { book: "Book now" },
  } as Pick<Dictionary, "reviews" | "cta"> as Dictionary;

  it("renders the prompt, a Book link to the locale booking path, and the phone", () => {
    render(<BookCta lang="en" dict={dict} />);
    expect(screen.getByText("Ready to book?")).toBeTruthy();
    const book = screen.getByRole("link", { name: "Book now" });
    expect(book.getAttribute("href")).toBe(`/en${site.booking}`);
    const phone = screen.getByRole("link", { name: site.contact.phone });
    expect(phone.getAttribute("href")).toBe(site.contact.phoneHref);
  });
});

describe("BackToServices", () => {
  it("links to the locale services index with an LTR arrow", () => {
    render(<BackToServices lang="en" label="All services" />);
    const link = screen.getByRole("link", { name: /All services/ });
    expect(link.getAttribute("href")).toBe("/en/services");
    expect(link.textContent).toContain("←");
  });

  it("flips the arrow for an RTL locale", () => {
    render(<BackToServices lang="ar" label="كل الخدمات" />);
    const link = screen.getByRole("link", { name: /الخدمات/ });
    expect(link.getAttribute("href")).toBe("/ar/services");
    expect(link.textContent).toContain("→");
  });
});

describe("RelatedServiceLink", () => {
  const serviceId = services[0].id;
  const dict = {
    serviceDetails: { [serviceId]: { title: "Test Service" } },
  } as unknown as Pick<Dictionary, "serviceDetails">;

  it("renders the label and links to the related service by its title", () => {
    render(
      <RelatedServiceLink
        lang="en"
        dict={dict}
        serviceId={serviceId}
        label="All services"
      />,
    );
    expect(screen.getByText("All services")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Test Service" });
    // Resolves serviceById + servicePath internally — the lookup both pages did.
    expect(link.getAttribute("href")).toBe(
      `/en${servicePath(serviceById(serviceId), "en")}`,
    );
  });
});
