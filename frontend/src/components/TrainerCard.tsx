import { Trainer } from "@/types";

export default function TrainerCard({ trainer }: { trainer: Trainer }) {
  return (
    <div className="flex flex-col items-center rounded-xl p-6 text-center">
      <div className="mb-4 h-20 w-20 overflow-hidden rounded-full bg-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* Replace with next/image once real photos are hosted on S3/CDN */}
        <img
          src={trainer.avatarUrl}
          alt={trainer.name}
          width={80}
          height={80}
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="font-bold text-slate-900">{trainer.name}</h3>
      <p className="mt-1 text-sm font-medium text-brand">
        {trainer.yearsExperience} Years Experience
      </p>
      {trainer.specialty && (
        <p className="mt-1 text-xs text-slate-400">{trainer.specialty}</p>
      )}
    </div>
  );
}
