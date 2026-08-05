import { ServicePhoto } from "@/components/ServicePhoto";
import type { ServiceId } from "@/lib/services";

export type GallerySlide = {
  id: ServiceId;
  photo: boolean;
  alt: string;
  caption: string;
};

// Static asymmetric gallery of real service photos. The homepage uses three
// carefully cropped images so the work feels curated instead of auto-playing.
export function Gallery({ slides }: { slides: GallerySlide[] }) {
  if (slides.length === 0) return null;
  return (
    <ul className="grid grid-cols-1 items-end gap-6 md:grid-cols-[1.15fr_0.85fr_0.7fr]">
      {slides.map((s, i) => {
        const height =
          i === 0
            ? "h-[360px] md:h-[520px]"
            : i === 1
              ? "h-[320px] md:h-[420px]"
              : "h-[280px] md:h-[340px]";

        return (
          <li key={s.id}>
            <div className={`overflow-hidden rounded-2xl ${height}`}>
              <ServicePhoto
                id={s.id}
                photo={s.photo}
                alt={s.alt}
                label={s.caption}
                sizes="(max-width: 768px) 100vw, 40vw"
                className="h-full w-full"
              />
            </div>
            <p className="mt-4 text-left text-sm font-semibold text-mocha">
              {s.caption}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
