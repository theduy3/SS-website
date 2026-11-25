import { test, expect } from "@playwright/test";

const manifestHrefs = (html: string) =>
  [...html.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => /\brel="manifest"/.test(tag))
    .map((tag) => tag.match(/\bhref="([^"]*)"/)?.[1]);

const PAGES = [
  ["/checkin", "/checkin.webmanifest"],
  ["/fr", "/manifest.webmanifest"],
  ["/queue", "/manifest.webmanifest"],
  ["/clientportal", "/manifest.webmanifest"],
  ["/subscription", "/manifest.webmanifest"],
  ["/admin/login", "/manifest.webmanifest"],
] as const;

for (const [path, href] of PAGES) {
  test(`${path} emits one manifest link to ${href}`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    expect(manifestHrefs(await res.text())).toEqual([href]);
  });
}

const MANIFESTS = [
  [
    "/checkin.webmanifest",
    { short_name: "Check-in", start_url: "/checkin", scope: "/checkin", display: "standalone" },
  ],
  ["/manifest.webmanifest", { short_name: "Sans Souci", start_url: "/fr", display: "standalone" }],
] as const;

for (const [path, expected] of MANIFESTS) {
  test(`${path} serves an installable manifest`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/manifest+json");
    expect(await res.json()).toMatchObject(expected);
  });
}
