// src/app/[lang]/gallery/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { imageGalleryGraph } from "@/lib/seo";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { galleryImages } from "@/lib/gallery";
import { SubpageIntro } from "@/components/SubpageIntro";

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "/gallery",
    meta: (dict) => ({
      title: dict.meta.galleryTitle,
      description: dict.meta.galleryDescription,
    }),
  });
}

export default async function GalleryPage({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);

  function photo(id: string) {
    return dict.gallery.photos[id as keyof typeof dict.gallery.photos];
  }

  return (
    <>
      <JsonLd
        data={imageGalleryGraph(dict.gallery.title, galleryImages, (id) =>
          photo(id),
        )}
      />
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.nav.gallery, route: "/gallery" }]}
      />
      <SubpageIntro
        lang={lang}
        eyebrow={dict.nav.gallery}
        title={dict.gallery.title}
        intro={dict.gallery.intro}
      />
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <Reveal>
          <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4">
            {galleryImages.map((img, index) => {
              const { alt, caption } = photo(img.id);
              return (
                <li key={img.id} className="mb-4 break-inside-avoid">
                  <figure>
                    <div
                      className={`relative overflow-hidden rounded-2xl ${
                        index % 3 === 0 ? "aspect-[4/5]" : "aspect-[4/3]"
                      }`}
                    >
                      <Image
                        src={img.file}
                        alt={alt}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                      />
                    </div>
                    <figcaption className="mt-2 text-sm text-mocha">
                      {caption}
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </section>
    </>
  );
}
