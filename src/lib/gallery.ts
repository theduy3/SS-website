// Gallery manifest. `file` is a path under /public. Localized alt + caption
// live in dict.gallery.photos[id]. Add a photo: drop the file in public/images,
// add an entry here, and add { alt, caption } for the id to all 4 dictionaries.
export type GalleryImage = { id: string; file: string };

export const galleryImages: readonly GalleryImage[] = [
  { id: "manicure", file: "/images/services/manicure.jpg" },
  { id: "pedicure", file: "/images/services/pedicure.jpg" },
  { id: "lash-extensions", file: "/images/services/lash-extensions.jpg" },
  { id: "waxing", file: "/images/services/waxing.jpg" },
  { id: "storefront", file: "/images/storefront.jpg" },
];
