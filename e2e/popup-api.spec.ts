import { test, expect } from "@playwright/test";

test.describe("/api/popups", () => {
  test("returns the highest-priority active pop-up from the fixture", async ({ request }) => {
    const res = await request.get("/api/popups");
    expect(res.ok()).toBeTruthy();
    const { popup } = await res.json();
    expect(popup).not.toBeNull();
    expect(popup.id).toBe("promo-active"); // priority 10, active; excludes expired/future/low
  });

  test("response shape carries type + version", async ({ request }) => {
    const { popup } = await (await request.get("/api/popups")).json();
    expect(popup.type).toBe("rich");
    expect(typeof popup.version).toBe("number");
  });
});
