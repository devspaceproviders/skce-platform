import { Star } from "lucide-react";
import { Testimonial } from "@/types";

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="rounded-xl bg-slate-50 p-6">
      <div className="mb-3 flex gap-0.5 text-amber-400">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <p className="mb-5 text-sm leading-relaxed text-slate-600">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
          {testimonial.initials}
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900">{testimonial.studentName}</p>
          <p className="text-xs text-brand">{testimonial.course}</p>
        </div>
      </div>
    </div>
  );
}
