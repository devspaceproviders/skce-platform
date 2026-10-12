"use client";

import { useState } from "react";
import { Trainer } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

function getAvatarUrl(avatarUrl: string) {
  if (
    avatarUrl.startsWith("http://") ||
    avatarUrl.startsWith("https://")
  ) {
    return avatarUrl;
  }

  // Uploaded profile photos are served by the backend.
  if (avatarUrl.startsWith("/uploads/")) {
    const backendUrl = API_URL.replace(/\/api\/?$/, "");
    return `${backendUrl}${avatarUrl}`;
  }

  return avatarUrl;
}

export default function TrainerCard({
  trainer,
}: {
  trainer: Trainer;
}) {
  // If the photo URL is broken, fall back to the initial instead of
  // showing a browser broken-image icon with alt text.
  const [imageFailed, setImageFailed] = useState(false);

  const hasPhoto =
    !!trainer.avatarUrl &&
    trainer.avatarUrl !== "/trainers/default.svg";

  const avatarUrl = hasPhoto
    ? getAvatarUrl(trainer.avatarUrl)
    : null;

  const initial =
    trainer.name?.trim().charAt(0).toUpperCase() || "T";

  const showPhoto = Boolean(avatarUrl) && !imageFailed;

  return (
    <div className="group flex flex-col items-center relative isolate overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0F2F5F] to-[#0B2A52] p-6 pt-7 text-center text-white shadow-lg shadow-blue-950/15 ring-1 ring-[#173B67]/20 transition duration-300 hover:-translate-y-1.5 hover:border-orange-400/50 hover:shadow-2xl hover:shadow-blue-950/30">
      <div className="pointer-events-none absolute -right-12 -top-12 -z-10 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 -z-10 h-40 w-40 rounded-full bg-blue-500/25 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-[#173B67]" />

      {/* Trainer Photo / Initial */}
      <div className="mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/90 bg-slate-100 shadow-lg shadow-black/30 ring-4 ring-orange-400/40 transition duration-300 group-hover:ring-orange-400">
        {showPhoto && avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarUrl}
            alt={trainer.name}
            width={96}
            height={96}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0B2A52] to-[#1d4d85] text-3xl font-bold text-white">
            {initial}
          </div>
        )}
      </div>

      {/* Trainer Name */}
      <h3 className="text-lg font-bold leading-snug text-white">
        {trainer.name}
      </h3>

      {/* Experience */}
      <p className="mt-1.5 text-sm font-semibold text-orange-300">
        {trainer.yearsExperience} Years Experience
      </p>

      {/* Specialty */}
      {trainer.specialty && (
        <p className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs font-medium leading-5 text-blue-100 ring-1 ring-white/10">
          {trainer.specialty}
        </p>
      )}
    </div>
  );
}
