import { test, expect } from "@playwright/test";

const BOOKING = "https://moo.wyf.mybluehost.me/website_94b04bc8/reservation/";

const localeCases = [
  {
    code: "fr",
    book: "Réserver",
    pages: [
      { link: "Services", heading: /nos services/i, path: "/fr/services" },
      {
        link: "Pourquoi nous",
        heading: /pourquoi nous choisir/i,
        path: "/fr/about",
      },
      {
        link: "Rendez-vous",
        heading: /prenez rendez-vous/i,
        path: "/fr/appointments",
      },
      { link: "Contact", heading: /nous contacter/i, path: "/fr/contact" },
    ],
  },
  {
    code: "en",
    book: "Book now",
    pages: [
      { link: "Services", heading: /our services/i, path: "/en/services" },
      { link: "About", heading: /why choose us/i, path: "/en/about" },
      {
        link: "Appointments",
        heading: /book today/i,
        path: "/en/appointments",
      },
      { link: "Contact", heading: /contact us/i, path: "/en/contact" },
    ],
  },
];

// "/" redirect behavior is covered deterministically in i18n.spec.ts.

for (const loc of localeCases) {
  test.describe(`navigation (${loc.code})`, () => {
    test("homepage loads with branding", async ({ page }) => {
      await page.goto(`/${loc.code}`);
      await expect(page).toHaveTitle(/Sans Souci/i);
      await expect(
        page
          .locator("header")
          .getByRole("link", { name: "Sans Souci Ongles & Spa" }),
      ).toBeVisible();
    });

    for (const { link, heading, path } of loc.pages) {
      test(`header nav → ${link}`, async ({ page }) => {
        await page.goto(`/${loc.code}`);
        await page
          .locator("header")
          .getByRole("link", { name: link, exact: true })
          .click();
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(
          page.getByRole("heading", { name: heading }).first(),
        ).toBeVisible();
      });
    }

    test("Book now points to the external booking system in a new tab", async ({
      page,
    }) => {
      await page.goto(`/${loc.code}`);
      const book = page.locator("header").getByRole("link", { name: loc.book });
      await expect(book).toHaveAttribute("href", BOOKING);
      await expect(book).toHaveAttribute("target", "_blank");
    });
  });
}
