// Tests the shared admin API envelope owner. Pins the three branches of the
// unwrap — ok+success, HTTP/success failure with detail composition, and the
// network catch — that the four admin hooks previously re-encoded by hand.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { adminRequest } from "./admin-request";

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

const labels = { fail: "Op failed", network: "Network error" };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("adminRequest", () => {
  it("unwraps data on res.ok + success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: true, data: [{ id: "a" }] }),
    );
    const r = await adminRequest<{ id: string }[]>("/x", undefined, labels);
    expect(r).toEqual({ ok: true, data: [{ id: "a" }] });
  });

  it("passes the RequestInit through to fetch", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: true }));
    const init = { method: "DELETE" };
    await adminRequest("/x", init, labels);
    expect(fetch).toHaveBeenCalledWith("/x", init);
  });

  it("returns the server error, composing detail, when success is false", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: false, error: "boom", detail: "disk full" }, true),
    );
    const r = await adminRequest("/x", undefined, labels);
    expect(r).toEqual({ ok: false, error: "boom (disk full)" });
  });

  it("uses the fail label when the failure carries no error field", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: false }, false));
    const r = await adminRequest("/x", undefined, labels);
    expect(r).toEqual({ ok: false, error: "Op failed" });
  });

  it("treats a non-ok HTTP response as a failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: true, error: "nope" }, false),
    );
    const r = await adminRequest("/x", undefined, labels);
    expect(r).toEqual({ ok: false, error: "nope" });
  });

  it("returns the network label when fetch rejects", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    const r = await adminRequest("/x", undefined, labels);
    expect(r).toEqual({ ok: false, error: "Network error" });
  });
});
