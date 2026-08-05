import { testimonials } from "@/data/testimonials";
import { ReviewCard } from "@/components/ReviewCard";

export function Testimonials({ emptyLabel }: { emptyLabel: string }) {
  if (testimonials.length === 0) {
    return <p className="text-mocha">{emptyLabel}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {testimonials.slice(0, 4).map((testimonial) => (
        <ReviewCard
          key={`${testimonial.author}-${testimonial.quote}`}
          review={{
            id: `${testimonial.author}-${testimonial.quote}`,
            author: testimonial.author,
            rating: testimonial.rating,
            dateISO: "",
            text: testimonial.quote,
          }}
        />
      ))}
    </div>
  );
}
