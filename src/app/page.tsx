import { ByTheNumbersSection } from "./_components/ByTheNumbersSection";
import { FooterCtaSection } from "./_components/FooterCtaSection";
import { HeroSection } from "./_components/HeroSection";
import { MotivationSection } from "./_components/MotivationSection";
import { TechStackSection } from "./_components/TechStackSection";
import { WorkflowSection } from "./_components/WorkflowSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <HeroSection />
        <ByTheNumbersSection />
        <MotivationSection />
        <TechStackSection />
        <WorkflowSection />
        <FooterCtaSection />
      </div>
    </main>
  );
}
