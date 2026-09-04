import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { StatsStrip } from "@/components/stats-strip";
import { GalleryGrid } from "@/components/gallery-grid";
import { FeaturedAlbums } from "@/components/featured-albums";
import { AboutTeam } from "@/components/about-team";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="overflow-x-hidden w-full max-w-full">
      <Navigation />
      <Hero />
      <StatsStrip />
      <GalleryGrid />
      <FeaturedAlbums />
      <AboutTeam />
      <Footer />
    </main>
  );
}
