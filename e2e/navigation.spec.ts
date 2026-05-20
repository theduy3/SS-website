import { test, expect } from "@playwright/test";

const pages = [
  { link: "Services", path: "/services", heading: /our services/i },
  { link: "About", path: "/about", heading: /who we are/i },
  { link: "Appointments", path: "/appointments", heading: /schedule today/i },
  { link: "Contact", path: "/contact", heading: /contact us/i },
];

test.describe("site navigation", () => {
  test("homepage loads with branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BLANC NAILS LOUNGE/i);
    await expect(
      page.locator("header").getByRole("link", { name: "BLANC NAILS LOUNGE" }),
    ).toBeVisible();
  });

  for (const { link, path, heading } of pages) {
    test(`header nav → ${link}`, async ({ page }) => {
      await page.goto("/");
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
    await page.goto("/");
    const book = page.locator("header").getByRole("link", { name: "Book now" });
    await expect(book).toHaveAttribute(
      "href",
      "https://abcapp.us/feedback/appointment?appid=uQXqGNI",
    );
    await expect(book).toHaveAttribute("target", "_blank");
  });
});
