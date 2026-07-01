// Composes the user-facing error with the store-layer `detail` the admin API
// returns on failure, so the owner sees the real cause (e.g. a Postgres
// message) without needing server-log access. Shared by usePopupList and
// usePopupForm, whose fetches all hit the same admin API error shape.
export function errText(
  data: { error?: string; detail?: string },
  fallback: string,
): string {
  const base = data.error ?? fallback;
  return data.detail ? `${base} (${data.detail})` : base;
}
