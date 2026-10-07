import { Star } from "lucide-react";
import { Testimonial } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

function getPhotoUrl(
  photoUrl?: string | null
): string | null {
  if (!photoUrl) {
    return null;
  }

  if (
    photoUrl.startsWith("http://") ||
    photoUrl.startsWith("https://")
  ) {
    return photoUrl;
  }

  const backendUrl = API_URL.replace(
    /\/api\/?$/,
    ""
  );

  return `${backendUrl}${
    photoUrl.startsWith("/") ? "" : "/"
  }${photoUrl}`;
}

export default function TestimonialCard({
  testimonial,
}: {
  testimonial: Testimonial;
}) {
  const photoUrl = getPhotoUrl(
    testimonial.profilePhotoUrl
  );

  // Clamp to 0–5 so a bad value can never break the layout.
  const rating = Math.max(
    0,
    Math.min(5, Math.round(Number(testimonial.rating) || 0))
  );

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div
        className="mb-4 flex gap-0.5"
        role="img"
        aria-label={`Rated ${rating} out of 5`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            fill="currentColor"
            strokeWidth={0}
            className={i < rating ? "text-amber-400" : "text-slate-200"}
          />
        ))}
      </div>

      <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-600">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={testimonial.studentName}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {testimonial.studentName?.trim().charAt(0).toUpperCase()}
          </span>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#173B67]">
            {testimonial.studentName}
          </p>

          <p className="truncate text-xs text-blue-600">
            {testimonial.course}
          </p>
        </div>
      </div>
    </div>
  );
}
