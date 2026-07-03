// Per-visitor "have they already seen this popup?" seam. Owns the once/session/
// daily/always frequency semantics against local/session storage, keyed by the
// popup's id+version so a re-published popup shows again. Extracted from
// PopupHost so the storage-degrade behaviour has a test surface (mirrors the
// parseRows/dark-referral precedent — tested through the real jsdom environment,
// no injected clock or storage). These are plain functions with no React; the
// client component just imports them.

import type { Popup } from "@/lib/popup";

const DAY_MS = 86_400_000;

export const seenKey = (p: Popup) => `popup:${p.id}:${p.version}`;

// True when this visitor is still eligible to see the popup. Any storage access
// failure (private mode, blocked cookies) degrades to showing it once this load.
export function shouldShow(p: Popup): boolean {
  if (p.frequency === "always") return true;
  try {
    const key = seenKey(p);
    if (p.frequency === "daily") {
      const last = Number(localStorage.getItem(key) ?? 0);
      return Date.now() - last > DAY_MS;
    }
    const store = p.frequency === "session" ? sessionStorage : localStorage;
    return !store.getItem(key);
  } catch {
    return true; // storage blocked → show once this load
  }
}

// Records that the popup was shown. `always` never records; `daily` stores the
// timestamp; `once`/`session` store a sentinel in local/session storage.
export function markSeen(p: Popup) {
  try {
    if (p.frequency === "always") return;
    if (p.frequency === "daily")
      localStorage.setItem(seenKey(p), String(Date.now()));
    else
      (p.frequency === "session" ? sessionStorage : localStorage).setItem(
        seenKey(p),
        "1",
      );
  } catch {
    /* ignore */
  }
}
