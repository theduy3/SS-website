import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services — BLANC NAILS LOUNGE",
  description: site.servicesIntro,
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader title="Our Services" intro={site.servicesIntro} />

      <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="space-y-16">
          {site.serviceMenu.map((group) => (
            <Reveal key={group.category}>
              <div>
                <h2 className="text-2xl text-espresso md:text-3xl">{group.category}</h2>
                <ul className="mt-6 divide-y divide-espresso/10">
                  {group.items.map((item) => (
                    <li key={item.name} className="flex items-baseline justify-between gap-6 py-3">
                      <span className="text-mocha">{item.name}</span>
                      <span className="whitespace-nowrap font-display text-sm text-espresso">
                        {item.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-16">
            <Button href={site.booking}>Book now</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
