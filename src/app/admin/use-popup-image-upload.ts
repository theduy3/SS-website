"use client";

import { useState } from "react";
import { adminRequest } from "./admin-request";

// Owns the popup image upload: POSTs the file to /api/admin/upload and tracks
// the in-flight/error state. Has no knowledge of the draft — `onUploaded` is
// called with the stored URL so the caller (PopupForm) folds it into the draft,
// mirroring usePopupForm's `onSaved` seam. The fetch envelope (unwrap + error+
// detail composition + network catch) goes through adminRequest, the shared
// client-side owner every admin fetch uses.
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
      const result = await adminRequest<{ url: string }>(
        "/api/admin/upload",
        { method: "POST", body: form },
        { fail: "Upload failed", network: "Upload network error" },
      );
      if (result.ok) onUploaded(result.data.url);
      else setError(result.error);
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
