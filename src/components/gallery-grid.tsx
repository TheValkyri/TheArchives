"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MagnifyingGlass,
  X,
  ArrowCounterClockwise,
  Images,
  CaretDown,
} from "@phosphor-icons/react";
import { FilterPills } from "./filter-pills";
import { GalleryCard } from "./gallery-card";
import { MediaLightbox } from "./media-lightbox";
import { mediaItems, schoolYears, getLiveMediaItems, type MediaItem } from "@/lib/data";

const PAGE_SIZE = 24;
const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
] as const;

type SortOrder = (typeof SORT_OPTIONS)[number]["value"];

export function GalleryGrid() {
  const [items, setItems] = useState<MediaItem[]>(mediaItems);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [selectedYear, setSelectedYear] = useState<string>("Tất cả năm");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    getLiveMediaItems().then((live) => {
      if (live) setItems(live);
    });
  }, []);

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const matchCategory =
        activeCategory === "Tất cả" || item.category === activeCategory;
      const matchYear =
        selectedYear === "Tất cả năm" || item.schoolYear === selectedYear;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        query === "" ||
        item.title.toLowerCase().includes(query) ||
        item.album.toLowerCase().includes(query) ||
        item.photographer.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query));
      return matchCategory && matchYear && matchSearch;
    });

    // getLiveMediaItems đã sort created_at desc → "Mới nhất" giữ nguyên,
    // "Cũ nhất" đảo chiều
    return sortOrder === "oldest" ? [...filtered].reverse() : filtered;
  }, [items, activeCategory, selectedYear, searchQuery, sortOrder]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );
  const remainingCount = filteredItems.length - visibleItems.length;

  const hasActiveFilters =
    activeCategory !== "Tất cả" ||
    selectedYear !== "Tất cả năm" ||
    searchQuery.trim() !== "";

  const resetFilters = () => {
    setActiveCategory("Tất cả");
    setSelectedYear("Tất cả năm");
    setSearchQuery("");
    setVisibleCount(PAGE_SIZE);
  };

  // Đổi filter/search → quay lại trang đầu
  const changeCategory = (cat: string) => {
    setActiveCategory(cat);
    setVisibleCount(PAGE_SIZE);
  };

  const changeYear = (year: string) => {
    setSelectedYear(year);
    setVisibleCount(PAGE_SIZE);
  };

  const changeSearch = (q: string) => {
    setSearchQuery(q);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <section id="gallery" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest text-accent uppercase">
              Kho tư liệu truyền thông
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Thư viện ảnh & video
            </h2>
            <p className="mt-3 max-w-[52ch] text-[15px] text-ink-2">
              Ghi lại trọn vẹn những cột mốc, sự kiện và khoảnh khắc đáng nhớ
              của thầy và trò THPT Vĩnh Thuận.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Tìm sự kiện, tác giả, tag..."
              className="w-full rounded-full border border-line bg-surface py-2.5 pr-9 pl-10 text-sm text-ink transition-[border-color] duration-200 placeholder:text-ink-3 hover:border-line-strong focus:border-line-strong focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => changeSearch("")}
                className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterPills active={activeCategory} onChange={changeCategory} />

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {/* Sắp xếp */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="cursor-pointer appearance-none rounded-full border border-line bg-surface py-2 pr-8 pl-3.5 text-[13px] text-ink transition-colors duration-200 hover:border-line-strong focus:outline-none"
                aria-label="Sắp xếp tư liệu"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <CaretDown
                size={12}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
              />
            </div>

            <select
              value={selectedYear}
              onChange={(e) => changeYear(e.target.value)}
              className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] text-ink transition-colors duration-200 hover:border-line-strong focus:outline-none"
              aria-label="Lọc theo năm học"
            >
              {schoolYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[13px] text-ink-2 transition-colors duration-200 hover:border-line-strong hover:text-ink"
                title="Đặt lại bộ lọc"
              >
                <ArrowCounterClockwise size={13} />
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        <p className="mt-5 text-[13px] text-ink-3">
          Hiển thị{" "}
          <span className="font-medium text-ink tabular-nums">
            {filteredItems.length}
          </span>{" "}
          trong số <span className="tabular-nums">{items.length}</span> tư liệu
        </p>

        {/* Grid — phân trang bằng Tải thêm */}
        <div
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent tabular-nums">
                  +{remainingCount.toLocaleString("vi-VN")}
                </span>
              </button>
            </div>
          )}

          {/* Đã tải hết — chỉ báo khi có nhiều mục */}
          {remainingCount === 0 && filteredItems.length > PAGE_SIZE && (
            <p className="col-span-full mt-2 text-center text-[13px] text-ink-3">
              Bạn đã xem hết {filteredItems.length.toLocaleString("vi-VN")} tư liệu
              trong bộ lọc hiện tại.
            </p>
          )}

          {/* Empty states */}
          {filteredItems.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface/60 px-8 py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-3">
                {items.length === 0 ? (
                  <Images size={22} />
                ) : (
                  <MagnifyingGlass size={22} />
                )}
              </div>

              {items.length === 0 ? (
                <div className="space-y-1.5">
                  <h3 className="font-medium text-ink">
                    Kho tư liệu đang chờ khoảnh khắc đầu tiên
                  </h3>
                  <p className="mx-auto max-w-md text-[13px] leading-relaxed text-ink-3">
                    Đội ngũ tác nghiệp đang ghi hình các sự kiện. Vậy lại
                    sau nhé — thư viện sẽ sớm đầy ắp hình ảnh.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <h3 className="font-medium text-ink">
                    Không tìm thấy tư liệu phù hợp
                  </h3>
                  <p className="mx-auto max-w-sm text-[13px] text-ink-3">
                    Thử thay đổi từ khóa hoặc đặt lại các bộ lọc.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 rounded-full bg-surface-2 px-5 py-2.5 text-[13px] font-semibold text-ink transition-colors duration-200 hover:bg-line"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <MediaLightbox
        item={activeItem}
        items={filteredItems}
        onClose={() => setActiveItem(null)}
        onNavigate={setActiveItem}
      />
    </section>
  );
}
