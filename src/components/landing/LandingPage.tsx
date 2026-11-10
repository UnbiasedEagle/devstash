import { ClosingSection } from "@/components/landing/ClosingSection";
import { CollectionsSection } from "@/components/landing/CollectionsSection";
import { DashboardSection } from "@/components/landing/DashboardSection";
import { ExportSection } from "@/components/landing/ExportSection";
import { FavoritesSection } from "@/components/landing/FavoritesSection";
import { FilesSection } from "@/components/landing/FilesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { KindsRow } from "@/components/landing/KindsRow";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { MarkdownSection } from "@/components/landing/MarkdownSection";
import { PricingSection } from "@/components/landing/PricingSection";

export function LandingPage() {
  return (
    // The hero picture is wider than the screen's content area on purpose, so sideways overflow is clipped here
    <div className="overflow-x-clip">
      <LandingHeader />
      <main>
        <HeroSection />
        <KindsRow />
        <DashboardSection />
        <FilesSection />
        <MarkdownSection />
        <CollectionsSection />
        <FavoritesSection />
        <ExportSection />
        <PricingSection />
        <ClosingSection />
      </main>
      <LandingFooter />
    </div>
  );
}
