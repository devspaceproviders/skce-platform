// import { Users, Lightbulb, Clock3, Award } from "lucide-react";
// import Reveal from "./Reveal";
// import SectionHeading from "./SectionHeading";

// const FEATURES = [
//   { icon: Users, title: "Experienced Trainers", description: "Learn from dedicated trainers who focus on practical understanding and helping students build useful skills." },
//   { icon: Lightbulb, title: "Practical Learning", description: "Our training focuses on hands-on learning so you can understand concepts and apply them with confidence." },
//   { icon: Clock3, title: "Flexible Learning", description: "Choose learning options that fit your schedule, with suitable course and batch options for different learners." },
//   { icon: Award, title: "Certificate Programs", description: "Complete your course requirements and receive a certificate that represents your learning and achievement." },
// ];

// export default function WhyChooseUs() {
//   return (
//     <section className="bg-[#F7F9FC] px-6 py-12 sm:py-16">
//       <div className="mx-auto max-w-7xl">
//         <SectionHeading eyebrow="Why SK Computer Education" title="Why Choose SK Computer Education?" description="Practical education, supportive trainers and flexible learning designed to help you move forward with confidence." />
//         <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
//           {FEATURES.map(({ icon: Icon, title, description }, index) => (
//             <Reveal key={title} delay={index * 100} className="h-full">
//               <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0F2F5F] to-[#0B2A52] p-6 text-white shadow-lg shadow-blue-950/15 transition duration-300 hover:-translate-y-1.5 hover:border-orange-400/50 hover:shadow-xl hover:shadow-blue-950/30">
//                 <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-orange-500 to-[#173B67] transition-transform duration-300 group-hover:scale-x-100" />
//                 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white transition duration-300 group-hover:rotate-3 group-hover:scale-110">
//                   <Icon size={22} strokeWidth={2} />
//                 </div>
//                 <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
//                 <p className="text-sm leading-6 text-blue-100/80">{description}</p>
//               </div>
//             </Reveal>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }



import { Users, Lightbulb, Clock3, Award } from "lucide-react";
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
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#F4F7FC] via-[#EAF1FB] to-[#F4F7FC] px-6 py-12 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-16 -z-10 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl"
      />

      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Why SK Computer Education"
          title="Why Choose SK Computer Education?"
          description="Practical education, supportive trainers and flexible learning designed to help you move forward with confidence."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 100} className="h-full">
              <div className="group relative h-full overflow-hidden rounded-2xl border border-[#173B67]/10 bg-gradient-to-br from-[#173B67] via-[#10315D] to-[#0B2A52] p-6 text-white shadow-lg shadow-blue-950/10 transition duration-300 hover:-translate-y-1.5 hover:border-orange-400/60 hover:shadow-xl hover:shadow-blue-950/20">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-400/10 blur-2xl transition duration-300 group-hover:bg-orange-400/20"
                />

                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-orange-400 via-orange-500 to-blue-400 transition-transform duration-300 group-hover:scale-x-100" />

                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-orange-300/20 bg-orange-500 text-white shadow-md shadow-orange-950/20 transition duration-300 group-hover:rotate-3 group-hover:scale-110">
                    <Icon size={22} strokeWidth={2} />
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-white transition-colors duration-300 group-hover:text-orange-200">
                    {title}
                  </h3>

                  <p className="text-sm leading-6 text-blue-100/85">
                    {description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
