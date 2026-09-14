import TestimonialCard from "./TestimonialCard";
import { getTestimonials } from "@/lib/api";

export default async function TestimonialsPreview() {
  const testimonials = await getTestimonials();

  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
            Student Feedback
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-4xl">
            What Our Students Say
          </h2>

          <p className="mt-4 text-slate-500">
            Hear from learners about their experience with SK Computer
            Education.
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 6).map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  );
}