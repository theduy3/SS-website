import { test, expect } from "@playwright/test";

const locales = ["en", "fr", "es", "ar"] as const;

test.describe("mobile quick-action bar", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: "ss_consent", value: "denied", url: "http://localhost:3100" },
    ]);
  });

  test("shows three actions on a public page", async ({ page }) => {
    await page.goto("/en/about");

    const bar = page.getByRole("navigation", { name: "Quick contact" });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole("link")).toHaveCount(3);
    await expect(bar.getByRole("link", { name: /call now/i })).toHaveAttribute(
      "href",
      "tel:+14505056450",
    );
    await expect(bar.getByRole("link", { name: /book now/i })).toHaveAttribute(
      "href",
      "/en/appointments",
    );
    await expect(bar.getByRole("link", { name: /directions/i })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  for (const locale of locales) {
    test(`hides the bar on ${locale} booking page`, async ({ page }) => {
      await page.goto(`/${locale}/appointments`);

      await expect(
        page.getByRole("navigation", { name: "Quick contact" }),
      ).toHaveCount(0);
    });
  }

  test("appears immediately after declining consent", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto("/en/about");
    await expect(
      page.getByRole("navigation", { name: "Quick contact" }),
    ).toHaveCount(0);

    await page
      .getByRole("region", { name: /cookie consent/i })
      .getByRole("button", { name: /decline/i })
      .click();

    await expect(
      page.getByRole("navigation", { name: "Quick contact" }),
    ).toBeVisible();
  });

  test("does not render the mobile bar on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/en/about");

    await expect(
      page.getByRole("navigation", { name: "Quick contact" }),
    ).toHaveCount(0);
  });

  test("uses RTL page direction and row order for Arabic", async ({ page }) => {
    await page.goto("/ar/about");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const bar = page.getByRole("navigation", { name: "Quick contact" });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole("link")).toHaveCount(3);
    await expect(bar.locator(":scope > div")).toHaveClass(
      /(^|\s)flex-row-reverse(\s|$)/,
    );
  });

  test("leaves the final footer above the fixed bar", async ({ page }) => {
    await page.goto("/en/about");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator("footer");
    const bar = page.getByRole("navigation", { name: "Quick contact" });
    await expect(footer).toBeVisible();
    await expect(bar).toBeVisible();

    const [footerBox, barBox] = await Promise.all([
      footer.boundingBox(),
      bar.boundingBox(),
    ]);

    if (!footerBox || !barBox) {
      throw new Error("Expected footer and quick contact bar geometry");
    }

    expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(barBox.y);
  });
});
