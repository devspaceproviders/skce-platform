import {
  Users,
  Lightbulb,
  Clock3,
  Award,
} from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Experienced Trainers",
    description:
      "Learn from dedicated trainers who focus on practical understanding and helping students build useful skills.",
  },
  {
    icon: Lightbulb,
    title: "Practical Learning",
    description:
      "Our training focuses on hands-on learning so you can understand concepts and apply them with confidence.",
  },
  {
    icon: Clock3,
    title: "Flexible Learning",
    description:
      "Choose learning options that fit your schedule, with suitable course and batch options for different learners.",
  },
  {
    icon: Award,
    title: "Certificate Programs",
    description:
      "Complete your course requirements and receive a certificate that represents your learning and achievement.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
            Why SKCE
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-4xl">
            Why Choose SK Computer Education?
          </h2>

          <p className="mt-4 text-slate-500">
            Practical education, supportive trainers and flexible learning
            designed to help you move forward with confidence.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Icon */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">
                <Icon size={22} strokeWidth={2} />
              </div>

              <h3 className="mb-3 text-lg font-bold text-[#102A43]">
                {title}
              </h3>

              <p className="text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}