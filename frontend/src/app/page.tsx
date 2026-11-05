
import HomepagePopup from "@/components/Homepagepopup";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import CoursesPreview from "@/components/CoursesPreview";
import PackagesPreview from "@/components/PackagesPreview";
import WhyChooseUs from "@/components/WhyChooseUs";
import TrainersPreview from "@/components/TrainersPreview";
import TestimonialsPreview from "@/components/TestimonialsPreview";
import CEOSection from "@/components/CEOSection";
import CTASection from "@/components/CTASection";
import { getTestimonials } from "@/lib/api";

export default async function HomePage() {
  const testimonials = await getTestimonials();

  return (
    <>
      <HomepagePopup />

      <main className="min-h-screen w-full overflow-x-hidden">
        <Hero />
        <StatsBar />
        <CoursesPreview />
        <PackagesPreview />
        <WhyChooseUs />
        <TrainersPreview />
        <TestimonialsPreview testimonials={testimonials} />
        <CEOSection />
        <CTASection />
      </main>
    </>
  );
}
