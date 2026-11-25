import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Metadata } from "next";

vi.mock("next/font/google", () => ({
  Space_Grotesk: () => ({ variable: "font-space-grotesk" }),
}));

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public");
const readManifest = (file: string) =>
  JSON.parse(readFileSync(join(publicDir, file), "utf8"));

const ICONS = [
  { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
];

describe("installable web app manifests", () => {
  it("public site installs as Sans Souci and opens /fr", () => {
    expect(readManifest("manifest.webmanifest")).toEqual({
      name: "Sans Souci Ongles & Spa",
      short_name: "Sans Souci",
      description:
        "Manucure, pédicure, extensions de cils et épilation au CF Carrefour Laval.",
      start_url: "/fr",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#141414",
      icons: ICONS,
    });
  });

  it("check-in kiosk installs as Check-in and opens /checkin", () => {
    expect(readManifest("checkin.webmanifest")).toEqual({
      name: "Sans Souci Check-in",
      short_name: "Check-in",
      description: "Customer check-in for Sans Souci Ongles & Spa.",
      start_url: "/checkin",
      scope: "/checkin",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#141414",
      icons: ICONS,
    });
  });
});

const ROOT_LAYOUTS: [string, () => Promise<Metadata>, string][] = [
  ["/checkin", async () => (await import("./checkin/layout")).metadata, "/checkin.webmanifest"],
  [
    "/fr",
    async () =>
      (await import("./[lang]/layout")).generateMetadata({
        params: Promise.resolve({ lang: "fr" }),
      }),
    "/manifest.webmanifest",
  ],
  ["/queue", async () => (await import("./queue/layout")).metadata, "/manifest.webmanifest"],
  [
    "/clientportal",
    async () => (await import("./clientportal/layout")).metadata,
    "/manifest.webmanifest",
  ],
  [
    "/subscription",
    async () => (await import("./subscription/layout")).metadata,
    "/manifest.webmanifest",
  ],
  ["/admin", async () => (await import("./admin/layout")).metadata, "/manifest.webmanifest"],
];

describe("root layout manifest links", () => {
  it.each(ROOT_LAYOUTS)("%s links its install manifest", async (_route, load, href) => {
    expect((await load()).manifest).toBe(href);
  });
});
