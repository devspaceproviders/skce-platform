import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TrainerCard from "./TrainerCard";
import { getTrainers } from "@/lib/api";

export default async function TrainersPreview() {
  const trainers = await getTrainers();

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
            Our Faculty
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-4xl">
            Meet Our Trainers
          </h2>

          <p className="mt-4 text-slate-500">
            Learn with dedicated trainers who guide you through practical
            concepts and help you build confidence in your skills.
          </p>
        </div>

        {/* Trainers */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {trainers.slice(0, 4).map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </div>

        {/* View All */}
        <div className="mt-10 text-center">
          <Link
            href="/trainers"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-[#173B67] transition hover:border-orange-500 hover:text-orange-500"
          >
            View All Trainers
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}