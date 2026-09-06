import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { StatsStrip } from "@/components/stats-strip";
import { SkillMarquee } from "@/components/marquee";
import { GalleryGrid } from "@/components/gallery-grid";
import { FeaturedAlbums } from "@/components/featured-albums";
import { Manifesto } from "@/components/manifesto";
import { AboutTeam } from "@/components/about-team";
import { CtaBand } from "@/components/cta-band";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <Navigation />
      {/* Attention */}
      <Hero />
      <StatsStrip />
      <SkillMarquee />
      {/* Interest */}
      <GalleryGrid />
      <FeaturedAlbums />
      {/* Desire */}
      <Manifesto />
      <AboutTeam />
      {/* Action */}
      <CtaBand />
      <Footer />
    </main>
  );
}
