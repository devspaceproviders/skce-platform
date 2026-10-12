import { Star } from "lucide-react";
import { Testimonial } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getPhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  const backendUrl = API_URL.replace(/\/api\/?$/, "");
  return `${backendUrl}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
}

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const photoUrl = getPhotoUrl(testimonial.profilePhotoUrl);
  const rating = Math.max(0, Math.min(5, Math.round(Number(testimonial.rating) || 0)));

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0F2F5F] to-[#0B2A52] p-6 text-white shadow-lg shadow-blue-950/15 transition duration-300 hover:-translate-y-1 hover:border-orange-400/50 hover:shadow-xl hover:shadow-blue-950/30">
      <div className="mb-4 flex gap-0.5" role="img" aria-label={`Rated ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={16} fill="currentColor" strokeWidth={0} className={i < rating ? "text-amber-400" : "text-white/25"} />
        ))}
      </div>
      <p className="mb-6 flex-1 text-sm leading-relaxed text-blue-100/90">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="flex items-center gap-3 border-t border-white/10 pt-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={testimonial.studentName} className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            {testimonial.studentName?.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{testimonial.studentName}</p>
          <p className="truncate text-xs text-orange-300">{testimonial.course}</p>
        </div>
      </div>
    </div>
  );
}
