"use client";

import { type Locale } from "@/lib/i18n";
import type { Draft } from "@/lib/popup-draft";
import { LocalizedGroup } from "./LocalizedGroup";
import { inputClass } from "./field-style";
import { usePopupImageUpload } from "@/app/admin/use-popup-image-upload";

export function PopupForm({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  saving,
  isNew,
}: {
  draft: Draft;
  setDraft: (next: Draft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  isNew: boolean;
}) {
  const { upload, uploading, error: uploadError } = usePopupImageUpload({
    onUploaded: (url) => setDraft({ ...draft, imageUrl: url }),
  });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft({ ...draft, [key]: value });

  const setLocalized = (
    key: "title" | "body" | "ctaLabel",
    loc: Locale,
    value: string,
  ) => setDraft({ ...draft, [key]: { ...draft[key], [loc]: value } });

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-tan">ID *</span>
          <input
            className={inputClass}
            value={draft.id}
            required
            disabled={!isNew}
            onChange={(e) => set("id", e.target.value.trim())}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-tan">Type</span>
          <select
            className={inputClass}
            value={draft.type}
            onChange={(e) => set("type", e.target.value as Draft["type"])}
          >
            <option value="rich">Rich (styled card)</option>
            <option value="embed">Embed (raw HTML)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-tan">Priority (higher wins)</span>
          <input
            type="number"
            className={inputClass}
            value={draft.priority}
            onChange={(e) => set("priority", Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-tan">
            Version (bump to re-show after edits)
          </span>
          <input
            type="number"
            className={inputClass}
            value={draft.version}
            onChange={(e) => set("version", Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-tan">Starts at</span>
          <input
            type="datetime-local"
            className={inputClass}
            value={draft.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-tan">Ends at</span>
          <input
            type="datetime-local"
            className={inputClass}
            value={draft.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-tan">Frequency</span>
          <select
            className={inputClass}
            value={draft.frequency}
            onChange={(e) =>
              set("frequency", e.target.value as Draft["frequency"])
            }
          >
            <option value="once">Once (ever)</option>
            <option value="session">Once per session</option>
            <option value="daily">Once per day</option>
            <option value="always">Every load</option>
          </select>
        </label>
      </div>

      {draft.type === "rich" ? (
        <>
          <LocalizedGroup
            label="Title"
            values={draft.title}
            required
            onChange={(loc, v) => setLocalized("title", loc, v)}
          />
          <LocalizedGroup
            label="Body"
            values={draft.body}
            required
            onChange={(loc, v) => setLocalized("body", loc, v)}
          />
          <LocalizedGroup
            label="Button label (optional — set a link below to enable)"
            values={draft.ctaLabel}
            onChange={(loc, v) => setLocalized("ctaLabel", loc, v)}
          />
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-tan">Button link (href)</span>
            <input
              className={inputClass}
              value={draft.ctaHref}
              placeholder="/appointments"
              onChange={(e) => set("ctaHref", e.target.value)}
            />
          </label>

          <fieldset className="rounded-xl border border-fog bg-beige/60 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-mocha">
              Image (optional)
            </legend>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={onPickImage}
                className="text-xs"
              />
              {uploading && <p className="text-xs text-tan">Uploading…</p>}
              {uploadError && (
                <p className="text-xs text-red-600">{uploadError}</p>
              )}
              {draft.imageUrl && (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- preview only */}
                  <img
                    src={draft.imageUrl}
                    alt=""
                    className="h-16 w-16 rounded object-cover"
                  />
                  <input
                    className={inputClass}
                    value={draft.imageAlt}
                    placeholder="Alt text"
                    onChange={(e) => set("imageAlt", e.target.value)}
                  />
                  <button
                    type="button"
                    className="text-xs text-red-600 underline"
                    onClick={() =>
                      setDraft({ ...draft, imageUrl: "", imageAlt: "" })
                    }
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </fieldset>
        </>
      ) : (
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-tan">Embed HTML *</span>
          <textarea
            className={`${inputClass} min-h-32 font-mono`}
            value={draft.html}
            required
            onChange={(e) => set("html", e.target.value)}
          />
        </label>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-pill bg-espresso px-4 py-2 text-sm text-cream disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save popup"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-pill border border-tan px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
