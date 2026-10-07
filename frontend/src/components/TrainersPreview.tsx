import {
  Users,
  Lightbulb,
  Clock3,
  Award,
} from "lucide-react";

import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

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
    <section className="bg-[#F7F9FC] px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Why SK Computer Education"
          title="Why Choose SK Computer Education?"
          description="Practical education, supportive trainers and flexible learning designed to help you move forward with confidence."
        />

        {/* Features */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 100} className="h-full">
              <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10">
                {/* Accent bar grows on hover */}
                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-orange-500 to-[#173B67] transition-transform duration-300 group-hover:scale-x-100" />

                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition duration-300 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white">
                  <Icon size={22} strokeWidth={2} />
                </div>

                <h3 className="mb-2 text-lg font-semibold text-[#173B67]">
                  {title}
                </h3>

                <p className="text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
