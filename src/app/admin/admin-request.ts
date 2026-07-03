// Client-side owner of the admin API envelope. Every admin fetch returns the
// same `{ success, data, error, detail }` shape (see src/lib/admin-http.ts, the
// server-side twin); this concentrates the unwrap — HTTP + JSON parse, the
// `res.ok && data.success` gate, the error+detail composition, and the network
// catch — so the four admin hooks stop re-encoding it. `init` is a raw
// RequestInit, so JSON bodies (save) and FormData (upload) both pass through
// without this knowing the body type.

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Composes the user-facing error with the store-layer `detail` the admin API
// returns on failure, so the owner sees the real cause (e.g. a Postgres message)
// without server-log access. Private to this module — the hooks go through
// adminRequest, which owns the whole failure path.
function errText(
  data: { error?: string; detail?: string },
  fallback: string,
): string {
  const base = data.error ?? fallback;
  return data.detail ? `${base} (${data.detail})` : base;
}

export async function adminRequest<T = unknown>(
  url: string,
  init: RequestInit | undefined,
  labels: { fail: string; network: string },
): Promise<AdminResult<T>> {
  try {
    const res = await fetch(url, init);
    const data = await res.json();
    if (res.ok && data.success) return { ok: true, data: data.data as T };
    return { ok: false, error: errText(data, labels.fail) };
  } catch {
    return { ok: false, error: labels.network };
  }
}
