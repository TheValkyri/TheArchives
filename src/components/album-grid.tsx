"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { GalleryCard } from "./gallery-card";
import { MediaLightbox } from "./media-lightbox";
import type { MediaItem } from "@/lib/data";

const PAGE_SIZE = 24;

/**
 * 1 IntersectionObserver duy nhất cho toàn lưới — reveal .card-hidden →
 * .card-in (CSS transition, once). Effect chạy lại sau mỗi lần render
 * (visibleCount đổi) để observer bắt các card mới do "Tải thêm".
 */
function useCardReveal() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      grid.querySelectorAll(".card-hidden").forEach((el) =>
        el.classList.add("card-in")
      );
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("card-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );

    grid.querySelectorAll(".card-hidden:not(.card-in)").forEach((el) =>
      io.observe(el)
    );
    return () => io.disconnect();
  });

  return gridRef;
}

/**
 * Lưới media chỉ đọc — dùng trong trang /album/[id].
 * Tái dùng GalleryCard + MediaLightbox, reveal bằng 1 IntersectionObserver.
 * Phân trang "Tải thêm" (24/lần) — không render hàng trăm card một lúc
 * (album lớn render all-at-once gây jank nặng khi vào trang).
 */
export function AlbumGrid({ items }: { items: MediaItem[] }) {
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const gridRef = useCardReveal();

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );
  const remainingCount = items.length - visibleItems.length;

  const lightboxItems = useMemo(() => items, [items]);

  return (
    <>
      <div
        ref={gridRef}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        style={{ gridAutoFlow: "dense" }}
      >
        {visibleItems.map((item, i) => (
          <GalleryCard
            key={item.id}
            item={item}
            index={i}
            onClick={() => setActiveItem(item)}
          />
        ))}

        {/* Nút Tải thêm */}
        {remainingCount > 0 && (
          <div className="col-span-full mt-4 flex justify-center">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition-[background-color,border-color,transform] duration-200 hover:border-line-strong hover:bg-surface-2 active:scale-[0.98]"
            >
              Tải thêm
              <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent tabular-nums">
                <CaretDown size={10} />
                +{remainingCount.toLocaleString("vi-VN")}
              </span>
            </button>
          </div>
        )}

        {/* Đã tải hết — chỉ báo khi album lớn */}
        {remainingCount === 0 && items.length > PAGE_SIZE && (
          <p className="col-span-full mt-2 text-center text-[13px] text-ink-3">
            Bạn đã xem hết {items.length.toLocaleString("vi-VN")} tư liệu
            trong album.
          </p>
        )}
      </div>

      <MediaLightbox
        item={activeItem}
        items={lightboxItems}
        onClose={() => setActiveItem(null)}
        onNavigate={setActiveItem}
      />
    </>
  );
}
