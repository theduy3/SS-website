import { reviews } from "@/lib/reviews";

export type Testimonial = { author: string; rating: 4 | 5; quote: string };

// Only verified review bodies are eligible for testimonial rendering.
const fromGoogle: readonly Testimonial[] = reviews.map((r) => ({
  author: r.author,
  rating: r.rating === 4 ? 4 : 5,
  quote: r.text,
}));

export const testimonials: readonly Testimonial[] = fromGoogle.slice(0, 6);
