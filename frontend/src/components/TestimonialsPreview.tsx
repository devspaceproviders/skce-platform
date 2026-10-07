import { MessageSquareQuote } from "lucide-react";
import TestimonialCard from "./TestimonialCard";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { getTestimonials } from "@/lib/api";

export default async function TestimonialsPreview() {
  const testimonials = await getTestimonials();
  const visibleTestimonials = testimonials.slice(0, 6);

  return (
    <section className="bg-[#F7F9FC] px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Student Feedback"
          title="What Our Students Say"
          description="Hear from learners about their experience with SK Computer Education."
        />

        {/* Testimonials */}
        {visibleTestimonials.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTestimonials.map((testimonial, index) => (
              <Reveal
                key={testimonial.id}
                delay={(index % 3) * 100}
                className="h-full"
              >
                <TestimonialCard testimonial={testimonial} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
              <MessageSquareQuote size={26} className="text-orange-500" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-[#173B67]">
              Student feedback is on the way
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Reviews from our learners will appear here soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
