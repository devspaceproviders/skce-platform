import TrainerCard from "@/components/TrainerCard";
import { getTrainers } from "@/lib/api";

export const metadata = { title: "Trainers — SKCE" };

export default async function TrainersPage() {
  const trainers = await getTrainers();

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold text-slate-900">Meet Our Trainers</h1>
          <p className="mt-3 text-slate-500">Industry veterans dedicated to your success.</p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {trainers.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </div>
      </div>
    </section>
  );
}
