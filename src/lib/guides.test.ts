// Guards the Article date facts (GEO-G): every guide carries an immutable
// `published` date, and a guide's PAGE_DATES last-modified entry can never
// precede it — AI engines cross-check dates, and modified-before-published
// reads as a fabricated freshness signal.

import { describe, expect, it } from "vitest";
import { guides, guidePath } from "@/lib/guides";
import { pageDate } from "@/lib/page-dates";

describe("guides — published date (GEO-G)", () => {
  it.each(guides.map((g) => [g.id, g] as const))(
    "%s has a YYYY-MM-DD published date on or before its last-modified date",
    (_id, guide) => {
      expect(guide.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // PAGE_DATES is keyed by the EN base path (same key sitemap/.md use).
      const modified = pageDate(guidePath(guide, "en"));
      expect(guide.published <= modified).toBe(true);
    },
  );
});
