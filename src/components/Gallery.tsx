"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { ServicePhoto } from "@/components/ServicePhoto";
import type { ServiceId } from "@/lib/services";

export type GallerySlide = {
  id: ServiceId;
  photo: boolean;
  alt: string;
  caption: string;
};

const AUTO_ADVANCE_MS = 5000;
const SWIPE_THRESHOLD = 60; // px of horizontal drag that commits a slide change

// Crossfading photo slideshow of real service work. Auto-advances on a timer
// (paused on hover/focus), with prev/next arrows, clickable dots, and mobile
// swipe. Honors prefers-reduced-motion: no auto-advance, instant swaps. The
// first slide renders without an entrance animation (initial={false}) so the
// SSR / no-JS / pre-hydration paint shows a photo immediately.
export function Gallery({
  slides,
  labels,
}: {
  slides: GallerySlide[];
  labels: { prev: string; next: string };
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || prefersReducedMotion || count <= 1) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      AUTO_ADVANCE_MS,
    );
    return () => window.clearInterval(id);
  }, [paused, prefersReducedMotion, count]);

  if (count === 0) return null;

  const active = slides[index];
  const duration = prefersReducedMotion ? 0 : 0.6;

  return (
    <div
      className="mx-auto max-w-4xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl sm:aspect-[16/9]"
        aria-roledescription="carousel"
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -SWIPE_THRESHOLD) go(index + 1);
              else if (info.offset.x > SWIPE_THRESHOLD) go(index - 1);
            }}
          >
            <ServicePhoto
              id={active.id}
              photo={active.photo}
              alt={active.alt}
              label={active.caption}
              sizes="(max-width: 896px) 100vw, 896px"
              className="pointer-events-none h-full w-full"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/70 to-transparent p-6 pt-12 text-left">
              <span className="text-lg font-medium text-cream">
                {active.caption}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={labels.prev}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-cream/80 p-2 text-espresso transition-colors hover:bg-cream"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={labels.next}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-cream/80 p-2 text-espresso transition-colors hover:bg-cream"
            >
              <Chevron direction="right" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-6 flex justify-center gap-3">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={slide.caption}
              aria-current={i === index}
              className={`h-2.5 rounded-full transition-all ${
                i === index
                  ? "w-8 bg-espresso"
                  : "w-2.5 bg-espresso/30 hover:bg-espresso/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}
