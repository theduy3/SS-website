import { test, expect } from "@playwright/test";

test.describe("homepage enhancements (/fr)", () => {
  test("hero has a Call Now tel link", async ({ page }) => {
    await page.goto("/fr");
    const call = page.getByRole("link", { name: /appelez-nous/i }).first();
    await expect(call).toHaveAttribute("href", "tel:+14505056450");
  });

  test("renders 10 testimonial cards", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.getByText(/Marie-Ève L\./)).toBeVisible();
    await expect(page.locator("section.bg-fog li")).toHaveCount(10);
  });

  test("service cards render real images (not placeholder)", async ({
    page,
  }) => {
    await page.goto("/fr");
    await expect(
      page.locator('img[srcset*="images%2Fservices"]').first(),
    ).toBeVisible();
  });

  test("header shows the logo with brand alt text", async ({ page }) => {
    await page.goto("/fr");
    await expect(
      page
        .locator("header")
        .getByRole("img", { name: "Sans Souci Ongles & Spa" }),
    ).toBeVisible();
  });
});
