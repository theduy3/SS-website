import { test, expect, type Locator } from "@playwright/test";

const order = "https://app.squareup.com/gift/MLPBY9ZZS24PE/order";
const balance = "https://app.squareup.com/gift/MLPBY9ZZS24PE/check-balance";

const copy = {
  fr: { buy: "Acheter une carte-cadeau", check: "Vérifier le solde", question: "Vendez-vous des cartes-cadeaux?" },
  en: { buy: "Buy a gift card", check: "Check balance", question: "Do you sell gift cards?" },
} as const;

async function expectGiftLinks(region: Locator, labels: (typeof copy)[keyof typeof copy]) {
  const links = region.getByRole("link");
  await expect(links).toHaveText([labels.buy, labels.check]);
  await expect(links.nth(0)).toHaveAttribute("href", order);
  await expect(links.nth(1)).toHaveAttribute("href", balance);
  return links;
}

test.describe("permanent gift cards", () => {
  test.use({ javaScriptEnabled: false });

  for (const [locale, labels] of Object.entries(copy)) {
    test(`${locale} serves accessible homepage and FAQ links without JavaScript`, async ({ page }, testInfo) => {
      for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 700 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`/${locale}`);
        const section = page.locator("#gift-cards");
        const links = await expectGiftLinks(section, labels);
        await links.nth(0).focus();
        await page.keyboard.press("Tab");
        await expect(links.nth(1)).toBeFocused();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
        if (viewport.width > 320) {
          await section.screenshot({ path: testInfo.outputPath(`${locale}-homepage-${viewport.width}.png`) });
        }
      }

      await page.goto(`/${locale}/faq`);
      const question = page.locator("summary").filter({ hasText: labels.question });
      const item = page.locator("details").filter({ has: question });
      await question.focus();
      await page.keyboard.press("Enter");
      const links = await expectGiftLinks(item, labels);
      await page.keyboard.press("Tab");
      await expect(links.nth(0)).toBeFocused();
      const answer = (await item.locator("p").textContent())!.trim();
      const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
      const faq = schema.map((json) => JSON.parse(json)).find((entry) => entry["@type"] === "FAQPage");
      expect(faq.mainEntity).toContainEqual({
        "@type": "Question",
        name: labels.question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      });
      const markdown = await page.request.get(`/${locale}/faq.md`);
      expect(await markdown.text()).toContain(answer);
    });
  }

  for (const locale of ["es", "ar"]) {
    test(`${locale} keeps the existing homepage and FAQ`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("#gift-cards")).toHaveCount(0);
      await page.goto(`/${locale}/faq`);
      await expect(page.locator(`details a[href="${order}"], details a[href="${balance}"]`)).toHaveCount(0);
    });
  }
});
