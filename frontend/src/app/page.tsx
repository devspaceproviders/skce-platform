import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import CoursesPreview from "@/components/CoursesPreview";
import PackagesPreview from "@/components/PackagesPreview";
import WhyChooseUs from "@/components/WhyChooseUs";
import TrainersPreview from "@/components/TrainersPreview";
import TestimonialsPreview from "@/components/TestimonialsPreview";
import CTASection from "@/components/CTASection";
import CEOSection from "@/components/CEOSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <CoursesPreview />
       <PackagesPreview />
      <WhyChooseUs />
      <TrainersPreview />
      <TestimonialsPreview />
      <CEOSection />
      <CTASection />
      
    </>
  );
}
