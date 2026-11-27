import { test, expect, type Page } from "@playwright/test";
import { AdminPopupSchema, pickActiveSorted, PopupSchema } from "../src/lib/popup";

const start = "2026-11-23T05:00:00.000Z";
const end = "2026-12-07T04:59:59.999Z";
const order = "https://app.squareup.com/gift/MLPBY9ZZS24PE/order";
const campaign = PopupSchema.parse({
  id: "black-friday-gift-cards-2026",
  type: "rich",
  presentation: "gift-card",
  version: 1,
  priority: 11,
  frequency: "session",
  startsAt: start,
  endsAt: end,
  title: { en: "Black Friday", fr: "Vendredi fou" },
  body: { en: "On gift cards purchased online.", fr: "Sur les cartes-cadeaux achetées en ligne." },
});
const subscribe = PopupSchema.parse({
  id: "subscribe-ss",
  type: "embed",
  version: 1,
  priority: 10,
  html: "<p>Subscribe</p>",
});
const impression = `popup:${campaign.id}:${campaign.version}`;

async function serveCampaignsAt(page: Page, time: string) {
  await page.clock.setFixedTime(new Date(time));
  await page.route("**/api/popups", async (route) => {
    const now = await page.evaluate(() => new Date().toISOString());
    const popups = pickActiveSorted([subscribe, campaign], new Date(now));
    await route.fulfill({ json: { popups, popup: popups[0] ?? null } });
  });
}

for (const [locale, labels] of Object.entries({
  fr: { title: "Vendredi fou", buy: "Acheter une carte-cadeau", close: "Fermer la promotion", date: "Du 23 novembre au 6 décembre 2026" },
  en: { title: "Black Friday", buy: "Buy a gift card", close: "Close promotion", date: "November 23 to December 6, 2026" },
})) {
  test(`${locale} gift-card popup wins priority and matches all three layouts`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await serveCampaignsAt(page, start);
    await page.goto(`/${locale}`);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toHaveAccessibleName(new RegExp(labels.title, "i"));
    await expect(dialog.getByText(labels.date)).toBeVisible();
    const buy = dialog.getByRole("link", { name: labels.buy, exact: true });
    await expect(dialog.getByRole("link")).toHaveCount(1);
    await expect(buy).toHaveAttribute("href", order);
    const image = dialog.locator("img");
    const heading = dialog.getByRole("heading");
    for (const [view, width, height] of [["desktop", 1280, 900], ["tablet", 768, 900], ["phone", 390, 844]] as const) {
      await page.setViewportSize({ width, height });
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      const art = (await image.boundingBox())!;
      const offer = (await heading.boundingBox())!;
      if (view === "desktop") expect(art.x + art.width).toBeLessThan(offer.x);
      else expect(art.y + art.height).toBeLessThan(offer.y);
      await dialog.screenshot({ path: testInfo.outputPath(`${locale}-popup-${view}.png`) });
    }
    await page.setViewportSize({ width: 320, height: 288 });
    await expect.poll(() => dialog.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    expect(await dialog.evaluate((node) => node.scrollWidth)).toBe(await dialog.evaluate((node) => node.clientWidth));
    await buy.scrollIntoViewIfNeeded();
    await expect(buy).toBeInViewport();
    await dialog.getByRole("button", { name: labels.close }).focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toHaveCount(0);
  });
}

for (const [time, active] of [
  ["2026-11-23T04:59:59.999Z", false],
  [start, true],
  [end, true],
  ["2026-12-07T05:00:00.000Z", false],
] as const) {
  test(`campaign availability at ${time}`, async ({ page }) => {
    await serveCampaignsAt(page, time);
    await page.goto("/en");
    if (active) await expect(page.getByRole("dialog", { name: /Black Friday/i })).toBeVisible();
    else await expect(page.locator('iframe[title="promotion"]')).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(page.locator("#gift-cards")).toBeVisible();
  });
}

test("invalid gift-card records cannot be saved or hide another eligible popup", () => {
  const invalidRecords = [
    { ...campaign, startsAt: null },
    { ...campaign, endsAt: "2026-12-07T04:59:59.000Z" },
    { ...campaign, body: { en: "On gift cards purchased online.", fr: " " } },
  ];
  for (const invalid of invalidRecords) {
    expect(AdminPopupSchema.safeParse(invalid).success).toBe(false);
    expect(pickActiveSorted([invalid, subscribe], new Date(start))).toEqual([subscribe]);
  }
});

for (const locale of ["es", "ar"]) {
  test(`${locale} falls back before recording a gift-card impression`, async ({ page }) => {
    await serveCampaignsAt(page, start);
    await page.goto(`/${locale}`);
    await expect(page.locator('iframe[title="promotion"]')).toBeVisible();
    expect(await page.evaluate((key) => sessionStorage.getItem(key), impression)).toBeNull();
    await page.goto("/en");
    await expect(page.getByRole("dialog", { name: /black friday/i })).toBeVisible();
  });
}

test("Escape restores focus, and dismissal lasts through the session", async ({ page, browser }) => {
  let releaseFeed!: () => void;
  const ready = new Promise<void>((resolve) => { releaseFeed = resolve; });
  await page.route("**/api/popups", async (route) => {
    await ready;
    const popups = pickActiveSorted([subscribe, campaign], new Date(start));
    await route.fulfill({ json: { popups } });
  });
  await page.goto("/en");
  const previous = page.locator("header a").first();
  await previous.focus();
  releaseFeed();
  const dialog = page.getByRole("dialog", { name: /black friday/i });
  const close = dialog.getByRole("button", { name: "Close promotion" });
  const buy = dialog.getByRole("link", { name: "Buy a gift card" });
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(buy).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(buy).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(previous).toBeFocused();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.locator('iframe[title="promotion"]')).toBeVisible();
  await expect(dialog).toHaveCount(0);
  const fresh = await browser.newContext({ baseURL: new URL(page.url()).origin });
  try {
    const next = await fresh.newPage();
    await serveCampaignsAt(next, start);
    await next.goto("/en");
    await expect(next.getByRole("dialog", { name: /black friday/i })).toBeVisible();
  } finally {
    await fresh.close();
  }
});
