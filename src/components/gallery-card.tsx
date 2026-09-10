"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, FilmSlate } from "@phosphor-icons/react";
import type { MediaItem } from "@/lib/data";

interface GalleryCardProps {
  item: MediaItem;
  index: number;
  onClick: () => void;
}

/**
 * Card lưới thư viện.
 *
 * Hiệu năng:
 * - KHÔNG dùng GSAP ScrollTrigger per-card (24-100+ trigger sống đồng thời gây jank).
 * - Reveal bằng 1 class CSS `.card-hidden` → `.card-in` qua IntersectionObserver
 *   trong GalleryGrid (1 observer cho toàn lưới, once).
 * - Skeleton shimmer đến khi ảnh/video thumb thật sự decode xong → không nhảy layout.
 * - Video thiếu thumb: nền gradient + icon film, KHÔNG load file .mp4 vào <Image>.
 */
export function GalleryCard({ item, index, onClick }: GalleryCardProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const delay = (index % 6) * 45;

  useEffect(() => {
    // Nếu ảnh nằm trong cache trình duyệt, onLoad có thể không phát trên một số
    // trình duyệt trước khi effect chạy — kiểm tra complete thủ công
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  const aspectClass =
    item.aspect === "portrait"
      ? "row-span-2 aspect-[3/4]"
      : item.aspect === "square"
        ? "aspect-square"
        : "aspect-[4/3]";

  // Card dùng thumbnail nhẹ; lightbox vẫn dùng file gốc.
  // Video: chỉ render <Image> khi CÓ thumb WebP — tránh nhét file mp4 vào img.
  const displaySrc = item.thumbUrl || (item.type === "photo" ? item.src : null);

  return (
    <article
      data-gallery-card
      onClick={onClick}
      className={`card-hidden group relative cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface-2 transition-colors duration-300 hover:border-line-strong ${aspectClass}`}
      style={{ "--card-delay": `${delay}ms` } as React.CSSProperties}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Xem chi tiết ${item.title}`}
    >
      {/* Skeleton shimmer — chiếm chỗ đến khi media sẵn sàng */}
      {!loaded && (
        <span
          aria-hidden="true"
          className="thumb-skeleton absolute inset-0 flex items-center justify-center"
        >
          {item.type === "video" && !displaySrc ? (
            <FilmSlate size={26} className="text-white/40" weight="duotone" />
          ) : null}
        </span>
      )}

      {displaySrc ? (
        <Image
          ref={imgRef}
          src={displaySrc}
          alt={item.title}
          fill
          unoptimized
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        // Video không có thumb → nền gradient + icon, không tải file gốc
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,var(--surface-2),var(--surface))]"
        >
          <FilmSlate size={30} className="text-ink-3/70" weight="duotone" />
        </span>
      )}

      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {item.type === "video" && (
        <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
          <Play size={9} weight="fill" />
          Video
        </span>
      )}

      <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 p-3 transition-transform duration-300 group-hover:translate-y-0">
        <span className="block truncate text-[13px] font-medium text-white drop-shadow-sm">
          {item.title}
        </span>
        <span className="mt-0.5 block text-[11px] text-white/70">
          {item.photographer} · {item.date}
        </span>
      </span>
    </article>
  );
}
