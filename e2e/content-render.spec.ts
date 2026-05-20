import { test, expect } from "@playwright/test";

// Homepage section headings, localized. The social block was replaced by the
// "Our Work" gallery slideshow, whose heading is bilingual.
const sectionsByLocale: Record<string, RegExp[]> = {
  fr: [
    /nos services/i,
    /pourquoi nous choisir/i,
    /nos réalisations/i,
    /nous contacter/i,
  ],
  en: [/our services/i, /why choose us/i, /our work/i, /contact us/i],
};

for (const [code, sections] of Object.entries(sectionsByLocale)) {
  test.describe(`homepage content renders (${code})`, () => {
    test("all sections are visible with JS (scroll reveal)", async ({
      page,
    }) => {
      await page.goto(`/${code}`);
      for (const name of sections) {
        await expect(page.getByRole("heading", { name }).first()).toBeVisible();
      }
    });
  });
}

// Reviews band: eyebrow + score render, and the "book online" CTA routes to the
// appointments page (where the booking widget lives).
const reviewsByLocale: Record<
  string,
  { eyebrow: RegExp; score: RegExp; book: string }
> = {
  fr: {
    eyebrow: /nos avis/i,
    score: /4,9\s*\/\s*5/,
    book: "Réservez en ligne",
  },
  en: { eyebrow: /our reviews/i, score: /4\.9\s*\/\s*5/, book: "Book online" },
};

for (const [code, r] of Object.entries(reviewsByLocale)) {
  test.describe(`homepage reviews section (${code})`, () => {
    test("shows rating and books to appointments", async ({ page }) => {
      await page.goto(`/${code}`);
      await expect(page.getByText(r.eyebrow).first()).toBeVisible();
      await expect(page.getByText(r.score).first()).toBeVisible();
      await expect(
        page.getByRole("link", { name: r.book, exact: true }),
      ).toHaveAttribute("href", `/${code}/appointments`);
    });
  });
}

// Regression guard for the Reveal SSR bug: with JS disabled, framer-motion never
// mounts. Content MUST still render — never stranded at opacity:0.
test.describe("without JavaScript (/fr)", () => {
  test.use({ javaScriptEnabled: false });

  test("all sections remain visible", async ({ page }) => {
    await page.goto("/fr");
    for (const name of sectionsByLocale.fr) {
      await expect(page.getByRole("heading", { name }).first()).toBeVisible();
    }
  });
});
