import { Trainer } from "@/types";

export default function TrainerCard({ trainer }: { trainer: Trainer }) {
  return (
    <div className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Trainer Photo */}
      <div className="mb-5 h-24 w-24 overflow-hidden rounded-full border-4 border-orange-50 bg-slate-100 ring-2 ring-orange-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trainer.avatarUrl}
          alt={trainer.name}
          width={96}
          height={96}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
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