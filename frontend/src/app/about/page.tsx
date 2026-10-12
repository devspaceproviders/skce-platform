

import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Target,
  Users,
} from "lucide-react";

import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import WhyChooseUs from "@/components/WhyChooseUs";

export const metadata = {
  title: "About — SK Computer Education",
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type CeoProfile = {
  name: string;
  designation: string;
  profilePhotoUrl: string | null;
  bioParagraph1: string | null;
  bioParagraph2: string | null;
  highlight1: string | null;
  highlight2: string | null;
};

const DEFAULT_CEO: CeoProfile = {
  name: "C. Neelima",
  designation: "Founder & CEO",
  profilePhotoUrl: null,
  bioParagraph1:
    "C. Neelima has been actively involved in education, training, and professional development since 2006, bringing over 20 years of experience to the field. With a strong passion for empowering learners through practical and industry-oriented education, she has been instrumental in shaping SK Computer Education and its vision for accessible, career-focused learning.",
  bioParagraph2:
    "Her leadership focuses on providing students with quality training, practical skills, and the confidence they need to build successful careers in a rapidly evolving digital world.",
  highlight1:
    "Empowering learners through practical, career-focused education",
  highlight2:
    "Building confidence through hands-on learning",
};

async function getCeoProfile(): Promise<CeoProfile> {
  try {
    const response = await fetch(`${API_URL}/ceo`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to load CEO profile");
    }

    const json = await response.json();

    if (json.success && json.data) {
      return {
        ...DEFAULT_CEO,
        ...json.data,
      };
    }
  } catch (error) {
    console.error("Failed to load CEO profile:", error);
  }

  return DEFAULT_CEO;
}

function getPhotoUrl(photoUrl: string | null): string {
  if (!photoUrl) {
    return "/images/ceo.png";
  }

  if (/^https?:\/\//i.test(photoUrl)) {
    return photoUrl;
  }

  const backendUrl = API_URL.replace(/\/api\/?$/, "");

  return `${backendUrl}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
}

export default async function AboutPage() {
  const ceo = await getCeoProfile();
  const ceoPhoto = getPhotoUrl(ceo.profilePhotoUrl);

  return (
    <>
      {/* Hero */}
      <PageHero
        eyebrow="About SK Computer Education"
        title="Empowering Learners Through Technology"
        description="For over a decade, SK Computer Education has helped thousands of students build practical computer skills and prepare for technology-driven careers through hands-on, industry-aligned training."
        contentWidth="max-w-4xl"
      />

      {/* Introduction */}
      <section className="w-full bg-white px-6 py-12 sm:py-16">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left Content */}
          <Reveal direction="left" className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500 sm:text-sm">
              Who We Are
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#173B67] sm:text-4xl">
              Building Skills for a Digital Future
            </h2>

            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              <span className="h-1 w-12 rounded-full bg-orange-500" />
              <span className="h-1 w-4 rounded-full bg-[#173B67]" />
            </div>

            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600 md:text-base">
              <p>
                SK Computer Education is focused on providing accessible,
                practical, and career-oriented computer education for learners
                at different stages of their journey.
              </p>

              <p>
                From foundational computer skills to programming, office
                applications, artificial intelligence, digital marketing, and
                other job-oriented areas, our courses are designed to help
                learners develop useful skills they can apply in real-world
                situations.
              </p>

              <p>
                We believe that quality education should combine strong
                fundamentals with practical learning, guidance, and continuous
                improvement.
              </p>
            </div>
          </Reveal>

          {/* Mission Card */}
          <Reveal direction="right" delay={120} className="w-full">
            <div className="group relative overflow-hidden rounded-3xl bg-[#173B67] p-8 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20 md:p-10">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />

              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 transition duration-300 group-hover:rotate-3 group-hover:scale-110">
                  <Target size={26} />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300 sm:text-sm">
                  Our Mission
                </p>

                <h3 className="mt-3 text-2xl font-bold leading-snug">
                  Make technology education practical, accessible, and
                  career-focused.
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-200">
                  Our goal is to help learners gain the confidence and practical
                  knowledge needed to use technology effectively in education,
                  employment, business, and everyday life.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* What We Offer */}
      <section className="w-full bg-[#F7F9FC] px-6 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl">
          <SectionHeading
            eyebrow="What We Offer"
            title="Learning Designed Around Your Goals"
            description="Explore learning options for students, professionals, job-seekers, and anyone looking to strengthen their digital skills."
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AboutCard
              index={0}
              icon={<GraduationCap size={22} />}
              title="Student Learning"
              description="Build strong computer fundamentals and develop skills that support academic and career growth."
            />

            <AboutCard
              index={1}
              icon={<BriefcaseBusiness size={22} />}
              title="Career Skills"
              description="Develop practical technology skills that can help you prepare for workplace opportunities."
            />

            <AboutCard
              index={2}
              icon={<BookOpen size={22} />}
              title="Practical Training"
              description="Learn through structured courses focused on useful concepts and hands-on application."
            />

            <AboutCard
              index={3}
              icon={<Users size={22} />}
              title="For Every Learner"
              description="Learning options designed for different backgrounds, goals, and levels of experience."
            />

            <AboutCard
              index={4}
              icon={<Award size={22} />}
              title="Skill Development"
              description="Strengthen your knowledge step by step and build confidence with technology."
            />

            <AboutCard
              index={5}
              icon={<Target size={22} />}
              title="Goal-Oriented Learning"
              description="Choose courses and packages based on the skills you want to develop."
            />
          </div>
        </div>
      </section>

      {/* Founder & CEO */}
      <section className="w-full bg-[#F7F9FC] px-6 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#071C3A] via-[#0F2F5F] to-[#173B67] p-6 shadow-2xl shadow-blue-950/20 sm:p-10 lg:p-14">
            <div className="sk-dots pointer-events-none absolute inset-0 -z-10" />
            <div className="sk-hero-orb pointer-events-none absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-orange-500/25 blur-3xl" />
            <div className="sk-hero-orb-2 pointer-events-none absolute -bottom-24 -left-16 -z-10 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-orange-500 via-blue-500 to-[#0B2A52]" />

            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-16">
              {/* CEO Image */}
              <Reveal direction="left" className="flex w-full justify-center">
                <div className="relative aspect-square w-full max-w-[360px]">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-blue-400 shadow-2xl shadow-black/30" />
                  <div className="absolute inset-[8px] rounded-full bg-[#0F2F5F]" />
                  <div className="absolute inset-[16px] overflow-hidden rounded-full ring-4 ring-white/90">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ceoPhoto}
                      alt={`${ceo.name} - ${ceo.designation} of SK Computer Education`}
                      className="block h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="absolute right-1 top-[16%] h-8 w-8 rounded-full bg-orange-500 shadow-lg ring-4 ring-[#0F2F5F]" />
                  <div className="absolute bottom-[8%] left-[8%] h-6 w-6 rounded-full bg-blue-400 ring-4 ring-[#0F2F5F]" />
                </div>
              </Reveal>

              {/* CEO Content */}
              <Reveal direction="right" delay={120} className="w-full min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300 sm:text-sm">
                  Our Leadership
                </p>

                <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                  Meet Our Founder &amp; CEO
                </h2>

                <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
                  <div className="h-1 w-16 rounded-full bg-orange-500" />
                  <div className="h-1 w-5 rounded-full bg-white/60" />
                </div>

                <h3 className="mt-6 text-2xl font-bold text-white">
                  {ceo.name}
                </h3>

                <p className="mt-1 text-base font-semibold text-orange-300">
                  {ceo.designation}
                </p>

                <div className="mt-5 space-y-4 text-base leading-8 text-blue-100/90">
                  <p className="whitespace-pre-line">{ceo.bioParagraph1}</p>
                  <p className="whitespace-pre-line">{ceo.bioParagraph2}</p>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[ceo.highlight1, ceo.highlight2].map((text, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-orange-300/40 hover:bg-white/10"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                        <Check size={14} strokeWidth={3} />
                      </span>

                      <p className="text-sm font-semibold leading-6 text-white">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <WhyChooseUs />
    </>
  );
}

/* About Card */
function AboutCard({
  icon,
  title,
  description,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <Reveal delay={(index % 3) * 100} className="h-full">
      <div className="group relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10">
        {/* Hidden by default; visible only while hovering this card */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-orange-500 to-[#173B67] transition-transform duration-300 group-hover:scale-x-100"
        />

        {/* Icon */}
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition-all duration-300 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white">
          {icon}
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-[#173B67] transition-colors duration-300 group-hover:text-[#0F2F5F]">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </Reveal>
  );
}
