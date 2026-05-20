import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Appointments — BLANC NAILS LOUNGE",
  description: site.appointmentsIntro,
};

export default function AppointmentsPage() {
  return (
    <>
      <PageHeader title="Schedule Today" intro={site.appointmentsIntro} />

      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
        <Reveal>
          <p className="leading-relaxed text-mocha">
            Booking opens in our secure scheduler. Pick your service and time, and we&apos;ll take
            care of the rest.
          </p>
          <div className="mt-10">
            <Button href={site.booking}>Book now</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
