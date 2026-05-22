import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { defaultLocale } from "@/lib/i18n";

// PWA / install manifest. Colours match the LIVE rendered theme in globals.css
// (grayscale palette: page bg #ffffff, header/footer #141414).
// start_url uses the default locale.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Sans Souci",
    description:
      "Manucure, pédicure, extensions de cils et épilation au CF Carrefour Laval.",
    start_url: `/${defaultLocale}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#141414",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
