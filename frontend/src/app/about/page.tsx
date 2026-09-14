import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Target,
  Users,
} from "lucide-react";
import WhyChooseUs from "@/components/WhyChooseUs";

export const metadata = {
  title: "About — SK Computer Education",
};

export default function AboutPage() {
  return (
    <>
      {/* ========================================================= */}
      {/* Hero Section */}
      {/* ========================================================= */}
      <section className="w-full bg-[#173B67] px-6 py-20 text-white">
        <div className="mx-auto w-full max-w-5xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-400">
            About SKCE
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Empowering Learners Through Technology
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-200 md:text-lg">
            For over a decade, SK Computer Education has helped thousands of
            students build practical computer skills and prepare for
            technology-driven careers through hands-on, industry-aligned
            training.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Introduction */}
      {/* ========================================================= */}
      <section className="w-full bg-white px-6 py-16">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2">
          
          {/* Left Content */}
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
              Who We Are
            </p>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#173B67]">
              Building Skills for a Digital Future
            </h2>

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
                fundamentals with practical learning, guidance, and
                continuous improvement.
              </p>
            </div>
          </div>

          {/* Mission Card */}
          <div className="w-full rounded-3xl bg-[#173B67] p-8 text-white shadow-lg md:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
              <Target size={26} />
            </div>

            <p className="text-sm font-bold uppercase tracking-wider text-orange-300">
              Our Mission
            </p>

            <h3 className="mt-3 text-2xl font-extrabold">
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
      </section>

      {/* ========================================================= */}
      {/* What We Offer */}
      {/* ========================================================= */}
      <section className="w-full bg-slate-50 px-6 py-16">
        <div className="mx-auto w-full max-w-7xl">

          {/* Section Heading */}
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
              What We Offer
            </p>

            <h2 className="mt-2 text-3xl font-extrabold text-[#173B67]">
              Learning Designed Around Your Goals
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Explore learning options for students, professionals,
              job-seekers, and anyone looking to strengthen their digital
              skills.
            </p>
          </div>

          {/* Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            <AboutCard
              icon={<GraduationCap size={22} />}
              title="Student Learning"
              description="Build strong computer fundamentals and develop skills that support academic and career growth."
            />

            <AboutCard
              icon={<BriefcaseBusiness size={22} />}
              title="Career Skills"
              description="Develop practical technology skills that can help you prepare for workplace opportunities."
            />

            <AboutCard
              icon={<BookOpen size={22} />}
              title="Practical Training"
              description="Learn through structured courses focused on useful concepts and hands-on application."
            />

            <AboutCard
              icon={<Users size={22} />}
              title="For Every Learner"
              description="Learning options designed for different backgrounds, goals, and levels of experience."
            />

            <AboutCard
              icon={<Award size={22} />}
              title="Skill Development"
              description="Strengthen your knowledge step by step and build confidence with technology."
            />

            <AboutCard
              icon={<Target size={22} />}
              title="Goal-Oriented Learning"
              description="Choose courses and packages based on the skills you want to develop."
            />

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Founder & CEO Section */}
      {/* ========================================================= */}
      <section className="w-full overflow-hidden bg-white px-6 py-20 md:py-24">
        <div className="mx-auto w-full max-w-7xl">

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* ===================================================== */}
            {/* CEO Image */}
            {/* ===================================================== */}
            <div className="flex w-full justify-center">

              <div className="relative h-[360px] w-[360px] sm:h-[420px] sm:w-[420px]">

                {/* Orange Outer Ring */}
                <div className="absolute inset-0 rounded-full border-[10px] border-orange-500" />

                {/* Blue Inner Ring */}
                <div className="absolute inset-[12px] rounded-full bg-[#173B67]" />

                {/* White Ring */}
                <div className="absolute inset-[20px] rounded-full bg-white" />

                {/* CEO Photo */}
                <div className="absolute inset-[27px] overflow-hidden rounded-full">
                  <img
                    src="/images/ceo.png"
                    alt="C. Neelima - Founder and CEO of SK Computer Education"
                    className="block h-full w-full object-cover object-center"
                  />
                </div>

                {/* Orange Decorative Dot */}
                <div className="absolute -right-2 top-24 h-9 w-9 rounded-full bg-orange-500 shadow-md" />

                {/* Blue Decorative Dot */}
                <div className="absolute bottom-2 left-12 h-6 w-6 rounded-full bg-[#173B67]" />

              </div>
            </div>

            {/* ===================================================== */}
            {/* CEO Content */}
            {/* ===================================================== */}
            <div className="min-w-0 w-full">

              {/* Small Heading */}
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
                Our Leadership
              </p>

              {/* Main Heading */}
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-[#102F4D] sm:text-4xl lg:text-5xl">
                Meet Our Founder & CEO
              </h2>

              {/* Heading Underline */}
              <div className="mt-6 flex items-center gap-2">
                <div className="h-1 w-24 rounded-full bg-orange-500" />
                <div className="h-1 w-7 rounded-full bg-[#173B67]" />
              </div>

              {/* CEO Name */}
              <h3 className="mt-8 text-2xl font-bold text-[#173B67]">
                C. Neelima
              </h3>

              {/* CEO Designation */}
              <p className="mt-1 text-base font-semibold text-orange-500">
                Founder & CEO
              </p>

              {/* CEO Description */}
              <div className="mt-8 space-y-5 text-base leading-8 text-slate-600">

                <p>
                  C. Neelima has been actively involved in education, training,
                  and professional development since 2006, bringing over 20
                  years of experience to the field. With a strong passion for
                  empowering learners through practical and industry-oriented
                  education, she has been instrumental in shaping SK Computer
                  Education and its vision for accessible, career-focused
                  learning.
                </p>

                <p>
                  Her leadership focuses on providing students with quality
                  training, practical skills, and the confidence they need to
                  build successful careers in a rapidly evolving digital world.
                </p>

              </div>

              {/* Leadership Highlights */}
              <div className="mt-8 space-y-4">

                {/* Highlight 1 */}
                <div className="flex items-start gap-3">

                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                    <span className="text-sm font-bold">
                      ✓
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#173B67] sm:text-base">
                    Empowering learners through practical, career-focused
                    education
                  </p>

                </div>

                {/* Highlight 2 */}
                <div className="flex items-start gap-3">

                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                    <span className="text-sm font-bold">
                      ✓
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#173B67] sm:text-base">
                    Building confidence through hands-on learning
                  </p>

                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Why Choose Us */}
      {/* ========================================================= */}
      <WhyChooseUs />
    </>
  );
}

/* ============================================================= */
/* About Card Component */
/* ============================================================= */

function AboutCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">

      {/* Icon */}
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-[#173B67]">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}