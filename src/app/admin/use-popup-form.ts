"use client";

import { useState } from "react";
import type { Popup } from "@/lib/popup";
import { emptyDraft, toDraft, toPopup, type Draft } from "@/lib/popup-draft";
import { adminRequest } from "./admin-request";

// Owns the currently-open draft: create/edit/cancel and save. Has no
// knowledge of the list itself — `onSaved` is called after a successful save
// so the caller (usePopupList's refresh) can pick up the change.
export function usePopupForm({
  onSaved,
}: {
  onSaved: () => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function create() {
    setDraft(emptyDraft());
    setIsNew(true);
    setError(null);
  }

  function edit(p: Popup) {
    setDraft(toDraft(p));
    setIsNew(false);
    setError(null);
  }

  function cancel() {
    setDraft(null);
  }

  async function save() {
    if (!draft) return;
    if (!draft.id.trim()) {
      setError("ID is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const popup = toPopup(draft);
      const result = await adminRequest(
        isNew
          ? "/api/admin/popups"
          : `/api/admin/popups/${encodeURIComponent(popup.id)}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(popup),
        },
        { fail: "Save failed", network: "Network error while saving" },
      );
      if (result.ok) {
        setDraft(null);
        await onSaved();
      } else {
        setError(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return { draft, setDraft, isNew, saving, error, create, edit, cancel, save };
}
