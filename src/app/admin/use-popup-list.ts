"use client";

import { useCallback, useEffect, useState } from "react";
import type { Popup } from "@/lib/popup";
import { errText } from "./admin-error";

type ListResult = { ok: true; data: Popup[] } | { ok: false; error: string };

async function fetchPopups(): Promise<ListResult> {
  try {
    const res = await fetch("/api/admin/popups");
    const data = await res.json();
    if (res.ok && data.success) return { ok: true, data: data.data };
    return { ok: false, error: errText(data, "Failed to load popups") };
  } catch {
    return { ok: false, error: "Network error loading popups" };
  }
}

// Owns the popup list: initial fetch, manual refresh (called after a save or
// delete), and delete. `error` covers list-load and delete failures only —
// save failures live in usePopupForm's own error, since save doesn't touch
// the list directly (it calls refresh() on success instead).
export function usePopupList() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyList = useCallback((result: ListResult) => {
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
      try {
        const res = await fetch(`/api/admin/popups/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (res.ok && data.success) await refresh();
        else setError(errText(data, "Delete failed"));
      } catch {
        setError("Network error while deleting");
      }
    },
    [refresh],
  );

  return { popups, loading, error, refresh, remove };
}
