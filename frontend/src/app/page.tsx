import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import CoursesPreview from "@/components/CoursesPreview";
import WhyChooseUs from "@/components/WhyChooseUs";
import TrainersPreview from "@/components/TrainersPreview";
import TestimonialsPreview from "@/components/TestimonialsPreview";
import CTASection from "@/components/CTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <CoursesPreview />
      <WhyChooseUs />
      <TrainersPreview />
      <TestimonialsPreview />
      <CTASection />
    </>
  );
}
