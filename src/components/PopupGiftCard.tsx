"use client";

import Image from "next/image";
import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { giftCardUrls, type GiftCardLocale } from "@/lib/gift-cards";
import type { Popup } from "@/lib/popup";

const copy = {
  fr: {
    number: "20 %",
    off: "de rabais",
    dates: "Du 23 novembre au 6 décembre 2026",
    close: "Fermer la promotion",
  },
  en: {
    number: "20%",
    off: "off",
    dates: "November 23 to December 6, 2026",
    close: "Close promotion",
  },
} as const;

export function PopupGiftCard({
  popup,
  locale,
  buyLabel,
  onClose,
}: {
  popup: Extract<Popup, { type: "rich" }>;
  locale: GiftCardLocale;
  buyLabel: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const buyRef = useRef<HTMLAnchorElement>(null);
  const eventId = useId();
  const offerId = useId();
  const detailId = useId();
  const datesId = useId();
  const labels = copy[locale];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    dialog.focus();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  function wrapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const focused = document.activeElement;
    if (event.shiftKey && (focused === closeRef.current || focused === event.currentTarget)) {
      event.preventDefault();
      buyRef.current?.focus();
    } else if (!event.shiftKey && (focused === buyRef.current || focused === event.currentTarget)) {
      event.preventDefault();
      closeRef.current?.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onKeyDown={wrapFocus}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby={`${eventId} ${offerId}`}
      aria-describedby={`${detailId} ${datesId}`}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[410px] overflow-y-auto overscroll-contain rounded-xl bg-[#f8efec] text-[#27171a] shadow-2xl outline-none backdrop:bg-espresso/60 min-[800px]:max-w-[744px]"
    >
      <div className="relative grid min-[800px]:grid-cols-[0.94fr_1.06fr]">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="absolute right-2.5 top-2.5 z-10 grid size-11 cursor-pointer place-items-center rounded-full bg-[#fff8f3] text-[28px] leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9f102b]"
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className="relative h-[clamp(155px,46vw,220px)] bg-[#4f0711] min-[800px]:h-auto min-[800px]:min-h-[395px]">
          <Image
            src="/images/black-friday-gift-cards.webp"
            alt=""
            fill
            unoptimized
            className="object-cover object-[center_55%]"
          />
        </div>
        <div className="self-center px-5 pb-6 pt-5 min-[800px]:px-10 min-[800px]:py-11">
          <p id={eventId} className="text-sm font-bold uppercase tracking-[0.12em]">{popup.title[locale]}</p>
          <h2 id={offerId} className="mb-3 mt-1.5 flex items-baseline gap-2 whitespace-nowrap text-[clamp(3.25rem,14vw,5rem)] font-bold leading-[0.93] tracking-[-0.095em] text-[#9f102b] min-[800px]:mb-[18px] min-[800px]:mt-[11px] min-[800px]:text-[clamp(3.65rem,8vw,6rem)]">
            <span>{labels.number}</span>
            <small className="text-[0.34em] tracking-[-0.05em]">{labels.off}</small>
          </h2>
          <p id={detailId} className="font-semibold leading-snug min-[800px]:text-lg">{popup.body[locale]}</p>
          <p id={datesId} className="mt-1.5 text-sm text-[#6e5458]">{labels.dates}</p>
          <div className="mt-4 border-t border-[#27171a]/20 pt-3 min-[800px]:mt-6 min-[800px]:pt-4">
            <a
              ref={buyRef}
              href={giftCardUrls.buy}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[46px] items-center justify-between gap-2 rounded-pill bg-[#9f102b] px-4 py-2 text-sm font-semibold text-[#fff8f3] hover:bg-[#860d24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9f102b]"
            >
              {buyLabel}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </dialog>
  );
}
