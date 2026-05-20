import { test, expect } from "@playwright/test";

// "Follow us on social" stays English in both locales — social was left
// unchanged per request.
const sectionsByLocale: Record<string, RegExp[]> = {
  fr: [/nos services/i, /pourquoi nous choisir/i, /follow us on social/i, /nous contacter/i],
  en: [/our services/i, /why choose us/i, /follow us on social/i, /contact us/i],
};

for (const [code, sections] of Object.entries(sectionsByLocale)) {
  test.describe(`homepage content renders (${code})`, () => {
    test("all sections are visible with JS (scroll reveal)", async ({ page }) => {
      await page.goto(`/${code}`);
      for (const name of sections) {
        await expect(page.getByRole("heading", { name }).first()).toBeVisible();
      }
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
