import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePopupForm } from "./use-popup-form";
import { emptyDraft } from "@/lib/popup-draft";
import { PopupSchema, type Popup } from "@/lib/popup";
import { parseRows } from "@/lib/popups-store";

function jsonResponse(body: unknown): Response {
  return { ok: true, json: async () => body } as Response;
}

const existingPopup: Popup = {
  id: "welcome",
  version: 1,
  priority: 0,
  startsAt: null,
  endsAt: null,
  frequency: "session",
  type: "embed",
  html: "<p>hi</p>",
};

describe("usePopupForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("create() opens an empty draft flagged as new", () => {
    const { result } = renderHook(() => usePopupForm({ onSaved: vi.fn() }));
    act(() => result.current.create());
    expect(result.current.isNew).toBe(true);
    expect(result.current.draft).toEqual(emptyDraft());
  });

  it("edit() opens the popup's draft flagged as not new", () => {
    const { result } = renderHook(() => usePopupForm({ onSaved: vi.fn() }));
    act(() => result.current.edit(existingPopup));
    expect(result.current.isNew).toBe(false);
    expect(result.current.draft?.id).toBe("welcome");
  });

  it("save() rejects an empty id without calling the API", async () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => usePopupForm({ onSaved }));
    act(() => result.current.create());
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.error).toBe("ID is required");
    expect(fetch).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("save() POSTs a new draft and calls onSaved on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: true }));
    const onSaved = vi.fn();
    const { result } = renderHook(() => usePopupForm({ onSaved }));
    act(() => result.current.create());
    act(() =>
      result.current.setDraft({ ...result.current.draft!, id: "welcome" }),
    );
    await act(async () => {
      await result.current.save();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/popups",
      expect.objectContaining({ method: "POST" }),
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.draft).toBeNull();
  });

  it("save() PUTs an existing draft to its id-scoped route", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: true }));
    const { result } = renderHook(() => usePopupForm({ onSaved: vi.fn() }));
    act(() => result.current.edit(existingPopup));
    await act(async () => {
      await result.current.save();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/popups/welcome",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("creates and re-saves the gift-card presentation with the exact UTC schedule", async () => {
    const saved: Popup[] = [];
    vi.mocked(fetch).mockImplementation(async (_url, options) => {
      const popup = PopupSchema.parse(JSON.parse(String(options?.body)));
      saved.push(popup);
      return jsonResponse({ success: true, data: popup });
    });
    const { result } = renderHook(() => usePopupForm({ onSaved: vi.fn() }));
    const startsAt = "2026-11-23T05:00:00.000Z";
    const endsAt = "2026-12-07T04:59:59.999Z";
    const local = (value: string) => {
      const date = new Date(value);
      return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
        .toISOString().slice(0, -1);
    };

    act(() => result.current.create());
    act(() => result.current.setDraft({
      ...result.current.draft!,
      id: "black-friday-gift-cards-2026",
      presentation: "gift-card",
      startsAt: local(startsAt),
      endsAt: local(endsAt),
      title: { en: "Black Friday", fr: "Vendredi fou", es: "", ar: "" },
      body: { en: "Offer", fr: "Offre", es: "", ar: "" },
    }));
    await act(() => result.current.save());
    expect(fetch).toHaveBeenLastCalledWith("/api/admin/popups", expect.objectContaining({ method: "POST" }));
    expect(saved[0]).toMatchObject({ presentation: "gift-card", startsAt, endsAt });

    const [reopened] = parseRows([{ id: saved[0].id, doc: saved[0] }]);
    act(() => result.current.edit(reopened));
    expect(result.current.draft?.presentation).toBe("gift-card");
    expect(result.current.draft?.endsAt).toBe(local(endsAt));
    await act(() => result.current.save());
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/admin/popups/black-friday-gift-cards-2026",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(saved[1]).toEqual(saved[0]);
  });

  it("save() surfaces a server error and keeps the draft open", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: false, error: "boom" }),
    );
    const onSaved = vi.fn();
    const { result } = renderHook(() => usePopupForm({ onSaved }));
    act(() => result.current.create());
    act(() => result.current.setDraft({ ...result.current.draft!, id: "x" }));
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.error).toBe("boom");
    expect(result.current.draft).not.toBeNull();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("cancel() clears the draft", () => {
    const { result } = renderHook(() => usePopupForm({ onSaved: vi.fn() }));
    act(() => result.current.create());
    act(() => result.current.cancel());
    expect(result.current.draft).toBeNull();
  });
});
