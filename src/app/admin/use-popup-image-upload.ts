"use client";

import { useState } from "react";
import { errText } from "./admin-error";

// Owns the popup image upload: POSTs the file to /api/admin/upload and tracks
// the in-flight/error state. Has no knowledge of the draft — `onUploaded` is
// called with the stored URL so the caller (PopupForm) folds it into the draft,
// mirroring usePopupForm's `onSaved` seam. Error+detail composition reuses
// errText, the same helper the other admin fetches use.
export function usePopupImageUpload({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUploaded(data.data.url);
      } else {
        setError(errText(data, "Upload failed"));
      }
    } catch {
      setError("Upload network error");
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
