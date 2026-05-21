// src/app/[lang]/gallery/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { isLocale, type LangParams } from "@/lib/i18n";
import { getDictionary } from "../dictionaries";
import { pageMetadata, imageGalleryGraph, breadcrumbGraph } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { galleryImages } from "@/lib/gallery";

export async function generateMetadata({
  params,
}: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/gallery", {
    title: dict.meta.galleryTitle,
    description: dict.meta.galleryDescription,
  });
}

export default async function GalleryPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

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
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "/" },
          { name: dict.nav.gallery, route: "/gallery" },
        ])}
      />
      <PageHeader title={dict.gallery.title} intro={dict.gallery.intro} />
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {galleryImages.map((img) => {
              const { alt, caption } = photo(img.id);
              return (
                <li key={img.id}>
                  <figure>
                    <div className="relative aspect-square overflow-hidden rounded-lg">
                      <Image
                        src={img.file}
                        alt={alt}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <figcaption className="mt-2 text-center text-sm text-mocha">
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
