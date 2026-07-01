// @vitest-environment node
// Node environment: getSupabaseAdmin()'s browser guard checks `typeof window`,
// which jsdom (this project's default test env) defines — node avoids that guard
// so the "unconfigured" branch (missing env vars) is what's under test, same as
// dark-referral.test.ts's getDarkReferrerCounts() test.
//
// Tests for the popups data-access layer. Following the same precedent as
// dark-referral.test.ts's getDarkReferrerCounts() test: the Supabase-touching
// functions are exercised via their graceful-degrade branch, not a mocked
// client — the test env has no SUPABASE_* env vars, so getSupabaseAdmin() /
// getSupabasePublic() naturally return null. The one pure piece (parseRows)
// is tested directly, same as buildInsertPayload in dark-referral.

import { describe, it, expect } from "vitest";
import {
  parseRows,
  readPopups,
  listPopups,
  upsertPopup,
  deletePopup,
  uploadPopupImage,
} from "./popups-store";
import type { Popup } from "./popup";

const validRow = {
  id: "welcome",
  doc: {
    id: "welcome",
    version: 1,
    priority: 0,
    startsAt: null,
    endsAt: null,
    frequency: "session",
    type: "embed",
    html: "<div>hi</div>",
  },
};

const invalidRow = { id: "stale", doc: { id: "stale", type: "unknown" } };

describe("parseRows", () => {
  it("returns an empty array for an empty input", () => {
    expect(parseRows([])).toEqual([]);
  });

  it("keeps rows that match PopupSchema and drops rows that don't", () => {
    const result = parseRows([validRow, invalidRow]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("welcome");
  });

  it("returns an empty array when every row is invalid", () => {
    expect(parseRows([invalidRow])).toEqual([]);
  });
});

describe("graceful degrade when Supabase is unconfigured", () => {
  // No SUPABASE_* env vars in the test env, so getSupabaseAdmin()/getSupabasePublic()
  // return null and every function below takes its "not configured" branch.

  it("readPopups returns null", async () => {
    expect(await readPopups()).toBeNull();
  });

  it("listPopups reports not_configured", async () => {
    expect(await listPopups()).toEqual({ ok: false, reason: "not_configured" });
  });

  it("upsertPopup reports not_configured", async () => {
    const popup: Popup = {
      id: "x",
      version: 1,
      priority: 0,
      startsAt: null,
      endsAt: null,
      frequency: "session",
      type: "embed",
      html: "<p>x</p>",
    };
    expect(await upsertPopup(popup)).toEqual({ ok: false, reason: "not_configured" });
  });

  it("deletePopup reports not_configured", async () => {
    expect(await deletePopup("x")).toEqual({ ok: false, reason: "not_configured" });
  });

  it("uploadPopupImage reports not_configured", async () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    expect(await uploadPopupImage(file)).toEqual({ ok: false, reason: "not_configured" });
  });
});
