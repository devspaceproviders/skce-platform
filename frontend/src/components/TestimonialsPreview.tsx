import TestimonialCard from "./TestimonialCard";
import { getTestimonials } from "@/lib/api";

export default async function TestimonialsPreview() {
  const testimonials = await getTestimonials();

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Student Stories
          </h2>
          <p className="mt-3 text-slate-500">Real outcomes from real students.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
