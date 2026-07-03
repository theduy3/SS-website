"use client";

import { useCallback, useEffect, useState } from "react";
import type { Popup } from "@/lib/popup";
import { adminRequest, type AdminResult } from "./admin-request";

function fetchPopups(): Promise<AdminResult<Popup[]>> {
  return adminRequest<Popup[]>("/api/admin/popups", undefined, {
    fail: "Failed to load popups",
    network: "Network error loading popups",
  });
}

// Owns the popup list: initial fetch, manual refresh (called after a save or
// delete), and delete. `error` covers list-load and delete failures only —
// save failures live in usePopupForm's own error, since save doesn't touch
// the list directly (it calls refresh() on success instead).
export function usePopupList() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyList = useCallback((result: AdminResult<Popup[]>) => {
    if (result.ok) {
      setPopups(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    applyList(await fetchPopups());
  }, [applyList]);

  // setState happens in the async .then callback, not synchronously in the
  // effect body. Initial `loading` state covers the first render.
  useEffect(() => {
    let active = true;
    fetchPopups().then((result) => {
      if (active) applyList(result);
    });
    return () => {
      active = false;
    };
  }, [applyList]);

  const remove = useCallback(
    async (id: string) => {
      if (!confirm(`Delete popup "${id}"? This cannot be undone.`)) return;
      setError(null);
      const result = await adminRequest(
        `/api/admin/popups/${encodeURIComponent(id)}`,
        { method: "DELETE" },
        { fail: "Delete failed", network: "Network error while deleting" },
      );
      if (result.ok) await refresh();
      else setError(result.error);
    },
    [refresh],
  );

  return { popups, loading, error, refresh, remove };
}
