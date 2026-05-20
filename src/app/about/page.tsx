import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — BLANC NAILS LOUNGE",
  description: "Meet Katie and Philip, the couple behind BLANC NAILS LOUNGE.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader title={site.about.heading} />

      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Reveal>
          <p className="text-lg leading-relaxed text-mocha">{site.about.body}</p>
        </Reveal>
        <Reveal>
          <div className="mt-12">
            <Button href="/services">View services</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
