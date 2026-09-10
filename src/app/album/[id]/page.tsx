import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
// Icon SSR entry — icon thường (dist root) dùng createContext, không chạy được
// trong server component
import {
  ArrowLeft,
  Images,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import { getAlbumWithItems } from "@/lib/data";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { AlbumGrid } from "@/components/album-grid";
import { DownloadZipButton } from "@/components/download-zip-button";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { id } = await params;
  const { album } = await getAlbumWithItems(id);
  if (!album) return { title: "Album — The Archives" };
  return {
    title: `${album.title} — The Archives · THPT Vĩnh Thuận`,
    description:
      album.description ||
      `Bộ sưu tập ảnh và video của sự kiện "${album.title}" (${album.schoolYear}).`,
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params;
  const { album, items } = await getAlbumWithItems(id);

  if (!album) notFound();

  const photoCount = items.filter((i) => i.type === "photo").length;
  const videoCount = items.filter((i) => i.type === "video").length;

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <Navigation />

      <section className="ambient-sky relative overflow-hidden pt-32 pb-10 md:pt-36">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Link
            href="/#albums"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:border-line-strong hover:text-ink"
          >
            <ArrowLeft size={14} />
            Về trang chủ
          </Link>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-widest text-accent uppercase">
                Album · {album.schoolYear}
              </p>
              <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink md:text-5xl">
                {album.title}
              </h1>
              {album.description && (
                <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-ink-2">
                  {album.description}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-3">
                <span className="flex items-center gap-1.5">
                  <Images size={15} />
                  <span className="tabular-nums">{album.count}</span> tư liệu
                </span>
                <span className="tabular-nums">
                  📷 {photoCount} ảnh · 🎬 {videoCount} video
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {album.driveFolderUrl && (
                <a
                  href={album.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-5 py-2.5 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:border-line-strong hover:text-ink"
                  title="Mở thư mục Google Drive gốc"
                >
                  Drive
                  <ArrowSquareOut size={12} />
                </a>
              )}
              <DownloadZipButton albumId={album.id} albumTitle={album.title} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface/30 py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          {items.length > 0 ? (
            <AlbumGrid items={items} />
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface/60 px-8 py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-3">
                <Images size={22} />
              </div>
              <h3 className="font-medium text-ink">Album chưa có tư liệu</h3>
              <p className="max-w-md text-[13px] leading-relaxed text-ink-3">
                Đội ngũ tác nghiệp đang biên tập. Quay lại sau nhé!
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
