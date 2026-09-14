import TrainerCard from "@/components/TrainerCard";
import { getTrainers } from "@/lib/api";

export const metadata = {
  title: "Trainers — SKCE",
};

export default async function TrainersPage() {
  const trainers = await getTrainers();

  return (
    <>
      {/* Hero */}
      <section className="bg-[#173B67] px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-400">
              Learn From Experts
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Meet Our Trainers
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
              Learn from dedicated trainers who bring practical knowledge,
              guidance, and real-world experience into the classroom.
            </p>
          </div>
        </div>
      </section>

      {/* Trainers */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          {/* Section Heading */}
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
              Our Faculty
            </p>

            <h2 className="mt-2 text-3xl font-extrabold text-[#173B67]">
              Meet the People Behind Your Learning
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Our trainers are here to help you understand concepts clearly,
              practise your skills, and move confidently toward your goals.
            </p>
          </div>

          {/* Trainer Grid */}
          {trainers.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trainers.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <h3 className="text-lg font-bold text-[#173B67]">
                Trainers Coming Soon
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Our trainer information will be available here soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}