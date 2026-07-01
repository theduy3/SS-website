// Filesystem-parity guard for STANDALONE_PATHS. A "standalone" route is an
// un-localized page that owns its own <html> root layout as a sibling of [lang]
// (kiosk / customer-portal surfaces). The proxy must skip locale-prefixing them,
// so every such route MUST be registered in STANDALONE_PATHS — otherwise it 301s
// to /{locale}/… and 404s. This test scans the app/ tree and fails, at CI time,
// the moment a new standalone route is added without a manifest entry (the class
// of bug that recurred for /clientportal and /subscription).

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { STANDALONE_PATHS } from "./standalone-routes";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "app");

// The two <html>-owning route trees that are deliberately NOT standalone:
//   [lang]  — localized; the proxy intentionally prefixes it.
//   admin   — handled by the admin auth branch, which returns before the
//             standalone check runs.
const NON_STANDALONE = new Set(["[lang]", "admin"]);

/** Directories under app/ whose layout.tsx renders <html> — the standalone signature. */
function standaloneRoutesOnDisk(): string[] {
  return readdirSync(appDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !NON_STANDALONE.has(e.name))
    .filter((e) => {
      try {
        return readFileSync(join(appDir, e.name, "layout.tsx"), "utf8").includes("<html");
      } catch {
        return false; // no layout.tsx → not a standalone root
      }
    })
    .map((e) => `/${e.name}`);
}

describe("STANDALONE_PATHS parity with the app/ tree", () => {
  it("registers every route that owns a standalone <html> layout", () => {
    const onDisk = standaloneRoutesOnDisk();
    // Sanity: the scan must actually find the known kiosk routes, or the
    // signature detection has silently broken and the guard is a no-op.
    expect(onDisk).toEqual(
      expect.arrayContaining(["/checkin", "/queue", "/clientportal", "/subscription"]),
    );

    const missing = onDisk.filter((route) => !STANDALONE_PATHS.has(route));
    expect(
      missing,
      `Standalone route(s) ${missing.join(", ")} own an <html> layout but are ` +
        `not in STANDALONE_PATHS (src/lib/standalone-routes.ts). Without an entry ` +
        `the proxy locale-prefixes them → 404. Add each path to the Set.`,
    ).toEqual([]);
  });
});
