import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { getDictionary } from "./dictionaries";
import { locales, isLocale, dirFor, type LangParams } from "@/lib/i18n";
import { site } from "@/lib/site";
import { organizationGraph } from "@/lib/seo";

// Archivo Black is a single-weight font — weight "400" is required.
const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
});

// Space Grotesk is variable — no explicit weight needed.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// Pre-render both locales at build time so /en and /fr stay static.
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    // Sitewide base URL — every relative metadata field (canonical, hreflang, og:url,
    // og:image) on every page composes against this. Set once, here.
    metadataBase: new URL(site.url),
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
    robots: { index: true, follow: true },
    // Local-SEO geo signals, mirroring the competitor (naillabnc.com) approach.
    other: {
      "geo.region": "CA-QC",
      "geo.placename": site.contact.address.city,
      "geo.position": `${site.geo.lat};${site.geo.lng}`,
      ICBM: `${site.geo.lat}, ${site.geo.lng}`,
    },
    // Search-engine ownership verification, read from env so codes never live in
    // source. Set GSC_VERIFICATION / BING_VERIFICATION in the deploy environment.
    // Unset → undefined → Next omits the tag (no empty <meta> emitted).
    verification: {
      google: process.env.GSC_VERIFICATION,
      ...(process.env.BING_VERIFICATION
        ? { other: { "msvalidate.01": process.env.BING_VERIFICATION } }
        : {}),
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LangParams & { children: React.ReactNode }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html
      lang={lang}
      dir={dirFor(lang)}
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        {/* Sitewide LocalBusiness + WebSite structured data. */}
        <JsonLd
          data={organizationGraph(lang, {
            name: site.name,
            description: dict.meta.homeDescription,
          })}
        />
        <Header dict={dict} locale={lang} />
        <main className="flex-1">{children}</main>
        <Footer dict={dict} />
      </body>
    </html>
  );
}
