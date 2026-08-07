import { describe, expect, it, vi } from "vitest";
import { notifyConsentChanged, SS_CONSENT_CHANGED_EVENT } from "./consent";

describe("notifyConsentChanged", () => {
  it("dispatches the shared consent event", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");

    notifyConsentChanged();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: SS_CONSENT_CHANGED_EVENT }),
    );
    dispatch.mockRestore();
  });
});
