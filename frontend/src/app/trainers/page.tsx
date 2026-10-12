import { Users } from "lucide-react";

import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import TrainerCard from "@/components/TrainerCard";
import { getTrainers } from "@/lib/api";

export const metadata = {
  title: "Trainers — SK Computer Education",
};

export default async function TrainersPage() {
  const trainers = await getTrainers();

  return (
    <>
      <PageHero
        eyebrow="Learn From Experts"
        title="Meet Our Trainers"
        description="Learn from dedicated trainers who bring practical knowledge, guidance, and real-world experience into the classroom."
        align="left"
        contentWidth="max-w-3xl"
      />

      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#E6EEF9] via-[#F4F7FC] to-[#E6EEF9] px-6 py-12 sm:py-16">
        <div className="sk-hero-orb pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="sk-hero-orb-2 pointer-events-none absolute -right-24 bottom-10 -z-10 h-72 w-72 rounded-full bg-orange-400/15 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Our Faculty"
            title="Meet the People Behind Your Learning"
            description="Our trainers are here to help you understand concepts clearly, practise your skills, and move confidently toward your goals."
          />

          {trainers.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6">
              {trainers.map((trainer, index) => (
                <Reveal
                  key={trainer.id}
                  delay={(index % 4) * 90}
                  className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] [&>*]:h-full [&>*]:w-full"
                >
                  <TrainerCard trainer={trainer} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                <Users size={26} className="text-orange-500" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-[#173B67]">
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
