import TrainerCard from "./TrainerCard";
import { getTrainers } from "@/lib/api";

export default async function TrainersPreview() {
  const trainers = await getTrainers();

  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Meet Our Trainers
          </h2>
          <p className="mt-3 text-slate-500">
            Industry veterans dedicated to your success.
          </p>
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
