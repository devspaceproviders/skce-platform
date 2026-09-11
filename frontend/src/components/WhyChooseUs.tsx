const FEATURES = [
  {
    emoji: "👨‍💼",
    title: "Industry Trainers",
    description:
      "All our faculty have 5–10+ years of real-world industry experience, not just academic backgrounds.",
  },
  {
    emoji: "💡",
    title: "Practical Curriculum",
    description:
      "Every course is built around live projects, case studies, and industry tools used in the market today.",
  },
  {
    emoji: "⏱️",
    title: "Flexible Modes",
    description:
      "Choose from online, offline, or hybrid batches — weekday or weekend — to fit your schedule.",
  },
  {
    emoji: "🏆",
    title: "Certificate Programs",
    description:
      "Receive a verifiable digital certificate upon course completion, recognized by 200+ hiring partners.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Why Choose SKCE?
          </h2>
          <p className="mt-3 text-slate-500">
            We don&apos;t just teach — we transform careers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl bg-slate-50 p-6">
              <span className="mb-3 block text-2xl">{f.emoji}</span>
              <h3 className="mb-2 font-bold text-slate-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
