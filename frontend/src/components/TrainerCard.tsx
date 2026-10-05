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
  const hasPhoto =
    !!trainer.avatarUrl &&
    trainer.avatarUrl !== "/trainers/default.svg";

  const avatarUrl = hasPhoto
    ? getAvatarUrl(trainer.avatarUrl)
    : null;

  const initial =
    trainer.name?.trim().charAt(0).toUpperCase() || "T";

  return (
    <div className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Trainer Photo / Initial */}
      <div className="mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-orange-50 bg-slate-100 ring-2 ring-orange-100">
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarUrl}
            alt={trainer.name}
            width={96}
            height={96}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-3xl font-extrabold text-[#173B67]">
            {initial}
          </div>
        )}
      </div>

      {/* Trainer Name */}
      <h3 className="text-lg font-extrabold text-[#173B67]">
        {trainer.name}
      </h3>

      {/* Experience */}
      <p className="mt-2 text-sm font-bold text-orange-500">
        {trainer.yearsExperience} Years Experience
      </p>

      {/* Specialty */}
      {trainer.specialty && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {trainer.specialty}
        </p>
      )}
    </div>
  );
}