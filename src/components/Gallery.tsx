import { ServicePhoto } from "@/components/ServicePhoto";
import type { ServiceId } from "@/lib/services";

export type GallerySlide = {
  id: ServiceId;
  photo: boolean;
  alt: string;
  caption: string;
};

// Continuous right→left marquee of real service photos. CSS-only (no JS) via the
// shared .animate-marquee / .marquee-pause utilities in globals.css. The track
// holds the slides duplicated once, so the -50% translate loops seamlessly;
// hover pauses it, and prefers-reduced-motion stops it (handled in CSS).
export function Gallery({ slides }: { slides: GallerySlide[] }) {
  if (slides.length === 0) return null;
  const items = [...slides, ...slides];
  return (
    <div className="marquee-pause overflow-hidden">
      <ul className="animate-marquee flex w-max">
        {items.map((s, i) => (
          <li
            key={i}
            aria-hidden={i >= slides.length || undefined}
            className="mr-6 w-[360px] shrink-0"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <ServicePhoto
                id={s.id}
                photo={s.photo}
                alt={s.alt}
                label={s.caption}
                sizes="360px"
                className="pointer-events-none h-full w-full"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/70 to-transparent p-6 pt-12 text-left">
                <span className="text-lg font-medium text-cream">
                  {s.caption}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
