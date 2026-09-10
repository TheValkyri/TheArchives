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
import {
  getLiveMediaItems,
  getLiveAlbums,
  getLiveStats,
  mediaItems,
  type MediaItem,
  type Album,
  type StatItem,
} from "@/lib/data";

export const revalidate = 60;

export default async function Home() {
  /* Fetch 1 lần trên server — bỏ trùng lặp Hero/GalleryGrid/StatsStrip
     từng tự gọi Supabase riêng (7+ query → giờ còn 3). */
  const [liveItems, liveAlbums, liveStats] = await Promise.all([
    getLiveMediaItems(),
    getLiveAlbums(),
    getLiveStats(),
  ]);

  const initialItems: MediaItem[] = liveItems.length > 0 ? liveItems : mediaItems;
  const heroItems = initialItems.slice(0, 6);
  const initialAlbums: Album[] = liveAlbums;
  const initialStats: StatItem[] = liveStats;

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <Navigation />
      {/* Attention */}
      <Hero initialItems={heroItems} />
      <StatsStrip initialStats={initialStats} />
      <SkillMarquee />
      {/* Interest */}
      <GalleryGrid initialItems={initialItems} initialAlbums={initialAlbums} />
      <FeaturedAlbums initialAlbums={initialAlbums} />
      {/* Desire */}
      <Manifesto />
      <AboutTeam />
      {/* Action */}
      <CtaBand />
      <Footer />
    </main>
  );
}
