import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePopupImageUpload } from "./use-popup-image-upload";

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

const file = new File(["x"], "photo.png", { type: "image/png" });

describe("usePopupImageUpload", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls onUploaded with the stored URL on success", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ success: true, data: { url: "/img/photo.png" } }),
    );
    const onUploaded = vi.fn();
    const { result } = renderHook(() => usePopupImageUpload({ onUploaded }));

    await act(async () => {
      await result.current.upload(file);
    });

    expect(onUploaded).toHaveBeenCalledWith("/img/photo.png");
    expect(result.current.error).toBeNull();
    expect(result.current.uploading).toBe(false);
  });

  it("sets a composed error (with detail) and skips onUploaded on failure", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ error: "Upload failed", detail: "disk full" }, false),
    );
    const onUploaded = vi.fn();
    const { result } = renderHook(() => usePopupImageUpload({ onUploaded }));

    await act(async () => {
      await result.current.upload(file);
    });

    expect(onUploaded).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Upload failed (disk full)");
  });

  it("reports a network error when fetch throws", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("boom"));
    const onUploaded = vi.fn();
    const { result } = renderHook(() => usePopupImageUpload({ onUploaded }));

    await act(async () => {
      await result.current.upload(file);
    });

    expect(onUploaded).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Upload network error");
  });

  it("clears a prior error when a new upload starts", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() =>
      usePopupImageUpload({ onUploaded: vi.fn() }),
    );

    await act(async () => {
      await result.current.upload(file);
    });
    expect(result.current.error).toBe("Upload network error");

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { url: "/img/ok.png" } }),
    );
    await act(async () => {
      await result.current.upload(file);
    });
    expect(result.current.error).toBeNull();
  });
});
