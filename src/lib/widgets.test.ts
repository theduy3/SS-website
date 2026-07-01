import { describe, it, expect } from "vitest";
import { widgets } from "./widgets";

// The catalog is data, so it's tested as data. `satisfies WidgetConfig` already
// gates the SHAPE at compile time; these guard the VALUES tsc can't — the
// non-default wiring that has actually regressed, and empty/typo'd entries.
// WidgetEmbed's own mechanism (storeAttr → attribute, theme → overlay) is
// covered generically in WidgetEmbed.test.tsx and is not re-tested here.

describe("widget catalog", () => {
  // The T3 regression class: portal + subscribe must override the default
  // "data-store", or their third-party script can't locate itself and silently
  // fails to mount. tsc can't catch a missing optional prop.
  it("client-account + subscribe override the store attribute", () => {
    expect(widgets.clientportal.storeAttr).toBe("data-account-store");
    expect(widgets.subscription.storeAttr).toBe("data-subscribe-store");
  });

  // The kiosk widgets rely on the default attribute; `satisfies` keeps their
  // literal types, so tsc already proves they carry no `storeAttr` key — no
  // runtime assertion can add to that guarantee.

  it("every widget has an https src and a non-empty fallback label", () => {
    for (const config of Object.values(widgets)) {
      expect(config.src).toMatch(/^https:\/\//);
      expect(config.fallbackLabel).toBeTruthy();
    }
  });
});
