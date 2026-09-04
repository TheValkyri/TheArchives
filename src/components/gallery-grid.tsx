"use client";

import { useState, useEffect, useMemo } from "react";
import { MagnifyingGlass, Funnel, ArrowCounterClockwise, UploadSimple } from "@phosphor-icons/react";
import { FilterPills } from "./filter-pills";
import { GalleryCard } from "./gallery-card";
import { MediaLightbox } from "./media-lightbox";
import { mediaItems, schoolYears, getLiveMediaItems, type MediaItem } from "@/lib/data";

export function GalleryGrid() {
  const [items, setItems] = useState<MediaItem[]>(mediaItems);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [selectedYear, setSelectedYear] = useState<string>("Tất cả năm");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  // Fetch dynamic items from Supabase if connected
  useEffect(() => {
    getLiveMediaItems().then((live) => {
      if (live && live.length > 0) {
        setItems(live);
      }
    });
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
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
  }, [items, activeCategory, selectedYear, searchQuery]);

  const hasActiveFilters =
    activeCategory !== "Tất cả" ||
    selectedYear !== "Tất cả năm" ||
    searchQuery.trim() !== "";

  const resetFilters = () => {
    setActiveCategory("Tất cả");
    setSelectedYear("Tất cả năm");
    setSearchQuery("");
  };

  return (
    <section id="gallery" className="py-24 md:py-32 relative">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-subtle">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent-blue font-semibold">
              KHO TƯ LIỆU TRUYỀN THÔNG
            </span>
            <h2 className="text-3xl md:text-5xl tracking-tighter font-semibold text-text-primary mt-2">
              Thư viện ảnh & video
            </h2>
            <p className="mt-3 text-text-secondary text-base max-w-[55ch]">
              Ghi lại trọn vẹn những cột mốc, sự kiện và khoảnh khắc đáng nhớ của thầy và trò THPT Vĩnh Thuận.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <div className="relative flex items-center">
              <MagnifyingGlass
                size={18}
                weight="light"
                className="absolute left-3.5 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sự kiện, tác giả, tag..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-bg-card border border-border-subtle hover:border-border-hover focus:border-accent-blue focus:outline-none text-sm text-text-primary placeholder:text-text-muted transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-xs text-text-muted hover:text-text-primary px-1.5 py-0.5 rounded bg-white/5"
                  aria-label="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <FilterPills active={activeCategory} onChange={setActiveCategory} />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Funnel size={14} weight="light" />
              <span>Năm học:</span>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 rounded-full bg-bg-card border border-border-subtle hover:border-border-hover text-xs text-text-primary focus:outline-none focus:border-accent-blue transition-colors cursor-pointer"
            >
              {schoolYears.map((year) => (
                <option key={year} value={year} className="bg-bg-card">
                  {year}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs text-accent-red hover:bg-accent-red/10 border border-accent-red/20 transition-all duration-200"
                title="Đặt lại bộ lọc"
              >
                <ArrowCounterClockwise size={13} weight="bold" />
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Result Meta Strip */}
        <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
          <span>
            Hiển thị <strong className="text-text-primary font-mono">{filteredItems.length}</strong> trong số{" "}
            <span className="font-mono">{items.length}</span> tư liệu
          </span>
          {searchQuery && (
            <span className="text-accent-gold">
              Kết quả cho &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>

        {/* Bento Masonry Grid */}
        <div
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-auto"
          style={{ gridAutoFlow: "dense" }}
        >
          {filteredItems.map((item, i) => (
            <GalleryCard
              key={item.id}
              item={item}
              index={i}
              onClick={() => setActiveItem(item)}
            />
          ))}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="col-span-full py-24 text-center rounded-3xl bg-bg-card/40 border border-dashed border-border-subtle p-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-white/5 mx-auto flex items-center justify-center text-text-muted">
                {items.length === 0 ? (
                  <UploadSimple size={28} weight="light" className="text-accent-blue" />
                ) : (
                  <MagnifyingGlass size={28} weight="light" />
                )}
              </div>

              {items.length === 0 ? (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-text-primary">
                    Kho tư liệu đang chờ cập nhật ảnh thật
                  </h3>
                  <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
                    Dữ liệu mẫu đã được làm sạch hoàn toàn. Ban Quản trị hãy đăng nhập vào Cổng Quản Trị để tải lên những bộ ảnh sự kiện đầu tiên lên kho S3 PIKAMC.
                  </p>
                  <div className="pt-3">
                    <a
                      href="/admin"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent-red hover:bg-accent-red-hover text-white text-xs font-semibold shadow-lg shadow-accent-red/25 transition-all duration-200"
                    >
                      <UploadSimple size={15} weight="bold" />
                      <span>Vào Cổng Quản Trị để tải ảnh</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-text-primary">
                    Không tìm thấy ảnh hoặc video phù hợp
                  </h3>
                  <p className="text-xs text-text-muted max-w-sm mx-auto">
                    Thử thay đổi từ khóa tìm kiếm hoặc bấm nút đặt lại các bộ lọc.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 px-5 py-2.5 rounded-full text-xs font-semibold bg-accent-blue hover:bg-accent-blue-hover text-white transition-all duration-200"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Viewer Modal */}
      <MediaLightbox
        item={activeItem}
        items={filteredItems}
        onClose={() => setActiveItem(null)}
        onNavigate={setActiveItem}
      />
    </section>
  );
}
