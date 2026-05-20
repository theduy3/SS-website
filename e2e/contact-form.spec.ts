import { test, expect } from "@playwright/test";

// The contact form lives in the homepage "Contact Us" section.
test.describe("contact form", () => {
  test("valid submission shows a confirmation", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("First name").fill("Ada");
    await page.getByLabel("Last name").fill("Lovelace");
    await page.getByLabel("Email").fill("ada@example.com");
    await page.getByLabel("Message").fill("I'd love to book an appointment.");

    await page.getByRole("button", { name: /send/i }).click();

    // Dev server accepts gracefully (provider not configured), so the form
    // swaps to its success state.
    await expect(page.getByText(/we've received your message/i)).toBeVisible();
  });

  test("empty submission is blocked by required-field validation", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /send/i }).click();

    // HTML5 required validation prevents submit — no success state appears,
    // and the first field reports invalid.
    await expect(page.getByText(/we've received your message/i)).toHaveCount(0);
    const firstName = page.getByLabel("First name");
    const valid = await firstName.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(valid).toBe(false);
  });
});
