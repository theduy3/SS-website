import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePopupList } from "./use-popup-list";

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

describe("usePopupList", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the list on mount", async () => {
    const popups = [{ id: "a" }];
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: true, data: popups }),
    );
    const { result } = renderHook(() => usePopupList());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.popups).toEqual(popups);
    expect(result.current.error).toBeNull();
  });

  it("surfaces the server's error message on load failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: false, error: "boom" }),
    );
    const { result } = renderHook(() => usePopupList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("boom");
    expect(result.current.popups).toEqual([]);
  });

  it("surfaces a network error message when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    const { result } = renderHook(() => usePopupList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network error loading popups");
  });

  it("remove() does nothing when the confirm dialog is declined", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: true, data: [] }),
    );
    const { result } = renderHook(() => usePopupList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    await act(async () => {
      await result.current.remove("x");
    });
    expect(fetch).toHaveBeenCalledTimes(1); // only the initial load
  });

  it("remove() deletes then refreshes the list", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [{ id: "a" }] })) // initial load
      .mockResolvedValueOnce(jsonResponse({ success: true })) // DELETE
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [] })); // refresh
    const { result } = renderHook(() => usePopupList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    await act(async () => {
      await result.current.remove("a");
    });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/admin/popups/a",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(result.current.popups).toEqual([]);
  });

  it("remove() surfaces a server error without refreshing", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [{ id: "a" }] }))
      .mockResolvedValueOnce(jsonResponse({ success: false, error: "in use" }));
    const { result } = renderHook(() => usePopupList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    await act(async () => {
      await result.current.remove("a");
    });
    expect(result.current.error).toBe("in use");
    expect(fetch).toHaveBeenCalledTimes(2); // no refresh call after a failed delete
  });
});
