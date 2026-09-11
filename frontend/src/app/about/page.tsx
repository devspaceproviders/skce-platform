import WhyChooseUs from "@/components/WhyChooseUs";

export const metadata = { title: "About — SKCE" };

export default function AboutPage() {
  return (
    <>
      <section className="bg-hero-gradient px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold sm:text-5xl">About SKCE</h1>
          <p className="mt-4 text-slate-300">
            For over a decade, SKCE has helped thousands of students launch
            careers in technology through hands-on, industry-aligned training.
          </p>
        </div>
      </section>
      <WhyChooseUs />
    </>
  );
}
