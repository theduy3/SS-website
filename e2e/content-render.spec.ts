import { test, expect } from "@playwright/test";

const sections = [/exclusive services/i, /uncover our story/i, /follow us on social/i, /contact us/i];

test.describe("homepage content renders", () => {
  test("all sections are visible with JS (scroll reveal)", async ({ page }) => {
    await page.goto("/");
    for (const name of sections) {
      await expect(page.getByRole("heading", { name }).first()).toBeVisible();
    }
  });

  // Regression guard for the Reveal SSR bug: with JS disabled, framer-motion
  // never mounts. Content MUST still render — it must not be stranded at
  // opacity:0. If Reveal ever bakes the hidden state into SSR again, this fails.
  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("all sections remain visible", async ({ page }) => {
      await page.goto("/");
      for (const name of sections) {
        await expect(page.getByRole("heading", { name }).first()).toBeVisible();
      }
    });
  });
});
