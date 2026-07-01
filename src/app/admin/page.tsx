"use client";

import { useRouter } from "next/navigation";
import { PopupForm } from "@/components/admin/PopupForm";
import { usePopupList } from "./use-popup-list";
import { usePopupForm } from "./use-popup-form";

export default function AdminPage() {
  const router = useRouter();
  const list = usePopupList();
  const form = usePopupForm({ onSaved: list.refresh });
  const error = list.error ?? form.error;

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">Popups</h1>
        <div className="flex gap-2">
          <button
            onClick={form.create}
            className="rounded-pill bg-espresso px-4 py-2 text-sm text-cream"
          >
            New popup
          </button>
          <button
            onClick={logout}
            className="rounded-pill border border-tan px-4 py-2 text-sm"
          >
            Log out
          </button>
        </div>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {form.draft ? (
        <section className="mb-8 rounded-2xl border border-tan bg-cream p-4">
          <h2 className="mb-4 text-lg">
            {form.isNew ? "New popup" : `Editing “${form.draft.id}”`}
          </h2>
          <PopupForm
            draft={form.draft}
            setDraft={form.setDraft}
            onSubmit={form.save}
            onCancel={form.cancel}
            saving={form.saving}
            isNew={form.isNew}
          />
        </section>
      ) : null}

      {list.loading ? (
        <p className="text-sm text-tan">Loading…</p>
      ) : list.popups.length === 0 ? (
        <p className="text-sm text-tan">
          No popups yet. Create one with “New popup”.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.popups.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-fog bg-beige px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.id}</p>
                <p className="text-xs text-tan">
                  {p.type} · priority {p.priority} · {p.frequency}
                  {p.endsAt ? ` · ends ${p.endsAt}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => form.edit(p)}
                  className="text-sm underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => list.remove(p.id)}
                  className="text-sm text-red-600 underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
