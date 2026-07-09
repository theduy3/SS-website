// Parity guard for LEGACY_REDIRECTS. The pre-2026-05 site published un-prefixed
// URLs (/prix, /reservation, …). Google still has them indexed and still renders
// them as brand sitelinks. The relaunch introduced /{locale} prefixes without a
// slug map, so the proxy prefixed them blindly: /prix → /fr/prix → 404. Four of
// the seven indexed URLs — 51% of page-level impressions in Search Console —
// pointed at dead pages for five weeks.
//
// A unit test asserting "/prix redirects" would not have caught that: the
// redirect existed, its target was the 404. So the load-bearing assertions here
// are the two parity checks against routeUniverse():
//   1. Every target resolves to a route the site actually publishes.
//   2. No key shadows a live route (a redirect must never eclipse a real page).
// Both fail at CI time the moment a route is renamed out from under the map.

import { describe, it, expect } from "vitest";

import { locales } from "./i18n";
import { routeUniverse } from "./route-universe";
import { LEGACY_REDIRECTS, matchLegacyPath } from "./legacy-redirects";

/** Every un-prefixed path the site publishes, across all locales. "" is home. */
function publishedPaths(): Set<string> {
  const paths = new Set<string>();
  for (const entry of routeUniverse()) {
    for (const locale of locales) paths.add(entry.pathByLocale[locale]);
  }
  return paths;
}

describe("LEGACY_REDIRECTS parity with the route universe", () => {
  it("points every target at a route the site actually publishes", () => {
    const published = publishedPaths();
    // Sanity: the scan must find known routes, or publishedPaths() has silently
    // broken and both assertions below degrade into no-ops.
    expect(published).toContain("/services");
    expect(published).toContain("");

    const dead = Object.entries(LEGACY_REDIRECTS)
      .filter(([, target]) => !published.has(target))
      .map(([key, target]) => `${key} → ${target}`);

    expect(
      dead,
      `Legacy redirect(s) ${dead.join(", ")} target a path that is not in the ` +
        `route universe (src/lib/route-universe.ts). The proxy would 301 an ` +
        `indexed URL straight into a 404 — the exact bug this map exists to fix. ` +
        `Repoint the target, or restore the route.`,
    ).toEqual([]);
  });

  it("never shadows a live route with a legacy key", () => {
    const published = publishedPaths();
    const shadowed = Object.keys(LEGACY_REDIRECTS).filter((key) => published.has(key));

    expect(
      shadowed,
      `Legacy key(s) ${shadowed.join(", ")} are also live routes. The proxy ` +
        `checks LEGACY_REDIRECTS before locale-prefixing, so these pages would ` +
        `become unreachable — redirected away from themselves.`,
    ).toEqual([]);
  });
});

describe("matchLegacyPath", () => {
  it("matches an un-prefixed legacy path and reports no locale", () => {
    expect(matchLegacyPath("/prix")).toEqual({ locale: null, target: "/services" });
  });

  it("matches a locale-prefixed legacy path and preserves that locale", () => {
    // Google's current chain is /prix → /fr/prix (the blind prefix) → 404. Until
    // it recrawls, /fr/prix must resolve too, and must not lose the locale.
    expect(matchLegacyPath("/fr/prix")).toEqual({ locale: "fr", target: "/services" });
    expect(matchLegacyPath("/en/reservation")).toEqual({
      locale: "en",
      target: "/appointments",
    });
  });

  it("maps /annonce to the home path (no announcements surface exists)", () => {
    expect(matchLegacyPath("/annonce")).toEqual({ locale: null, target: "" });
  });

  it("returns null for a live route, so normal locale routing still runs", () => {
    expect(matchLegacyPath("/about")).toBeNull();
    expect(matchLegacyPath("/fr/services")).toBeNull();
  });

  it("returns null for a bare locale root", () => {
    // "/fr" splits to ["", "fr"] — the remainder is "/", not a legacy key.
    expect(matchLegacyPath("/fr")).toBeNull();
  });

  it("returns null for an unknown path", () => {
    expect(matchLegacyPath("/nope")).toBeNull();
    expect(matchLegacyPath("/fr/nope")).toBeNull();
  });
});
