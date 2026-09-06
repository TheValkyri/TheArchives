"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Images,
  ArrowRight,
  ArrowSquareOut,
  FolderPlus,
  CaretLeft,
  CaretRight,
  PencilSimple,
} from "@phosphor-icons/react";

import { getLiveAlbums, type Album } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { EditAlbumModal } from "./edit-album-modal";

export function FeaturedAlbums() {
  const [albumList, setAlbumList] = useState<Album[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  const loadAlbums = useCallback(() => {
    getLiveAlbums().then((live) => {
      if (live) setAlbumList(live);
    });
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  /* Lắng nghe storage event từ admin (notifySync) + tự refresh */
  useEffect(() => {
    const onStorage = () => loadAlbums();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadAlbums]);

  /* Chỉ hiện nút chỉnh sửa khi có session admin */
  useEffect(() => {
    let cancelled = false;
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (!cancelled) setIsAdmin(Boolean(data.session?.user));
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAdmin(Boolean(session?.user));
      });
      return () => {
        cancelled = true;
        listener.subscription.unsubscribe();
      };
    }
  }, []);

  // Empty state
  if (albumList.length === 0) {
    return (
      <section
        id="albums"
        className="scroll-mt-20 border-y border-line bg-surface/50 py-16"
      >
        <div className="mx-auto max-w-6xl space-y-3 px-4 text-center md:px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-3">
            <FolderPlus size={22} />
          </div>
          <h2 className="text-lg font-semibold text-ink">
            Bộ sưu tập Album sắp ra mắt
          </h2>
          <p className="mx-auto max-w-md text-[13px] text-ink-3">
            Đội ngũ đang biên tập các chuyên đề sự kiện. Quay lại đây sớm để
            xem những bộ sưu tập đầu tiên.
          </p>
        </div>
      </section>
    );
  }

  const scrollBy = (dir: 1 | -1) => {
    const el = document.getElementById("albums-track");
    if (el) el.scrollBy({ left: dir * 440, behavior: "smooth" });
  };

  return (
    <section
      id="albums"
      className="scroll-mt-20 overflow-hidden border-y border-line bg-surface/50 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-widest text-accent uppercase">
              Bộ sưu tập chủ đề
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Album nổi bật
            </h2>
            <p className="mt-3 max-w-[48ch] text-[15px] text-ink-2">
              Các sự kiện lớn của Đoàn trường được tập hợp thành từng album
              chuyên đề để dễ dàng tra cứu.
            </p>
          </div>

          {/* Desktop arrows */}
          <div className="hidden gap-2 md:flex">
            <button
              onClick={() => scrollBy(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg text-ink transition-colors duration-200 hover:border-line-strong hover:bg-surface-2"
              aria-label="Album trước"
            >
              <CaretLeft size={18} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg text-ink transition-colors duration-200 hover:border-line-strong hover:bg-surface-2"
              aria-label="Album tiếp theo"
            >
              <CaretRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Native scroll-snap carousel — mượt trên mobile, không chiếm scroll trang */}
      <div
        id="albums-track"
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 md:px-6 lg:px-[max(1.5rem,calc((100vw-72rem)/2))]"
      >
        {albumList.map((album) => (
          <article
            key={album.id}
            className="group w-[320px] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-bg transition-colors duration-300 hover:border-line-strong sm:w-[400px]"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={album.cover}
                alt={album.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                sizes="400px"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[11px] text-white backdrop-blur-sm">
                {album.schoolYear}
              </span>

              {/* Nút chỉnh sửa — chỉ admin nhìn thấy */}
              {isAdmin && (
                <button
                  onClick={() => setEditingAlbum(album)}
                  className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-[background-color,transform] duration-200 hover:scale-105 hover:bg-accent"
                  aria-label={`Chỉnh sửa album ${album.title}`}
                  title="Chỉnh sửa album"
                >
                  <PencilSimple size={16} />
                </button>
              )}

              <div className="absolute inset-x-4 bottom-3">
                <h3 className="text-lg font-semibold text-white">
                  {album.title}
                </h3>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-3">
                {album.description}
              </p>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="flex items-center gap-1.5 text-[12px] text-ink-3">
                  <Images size={14} />
                  <span className="tabular-nums">{album.count} tư liệu</span>
                </span>
                <span className="flex items-center gap-2">
                  {album.driveFolderUrl && (
                    <a
                      href={album.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-[12px] text-ink-2 transition-colors duration-200 hover:bg-line hover:text-ink"
                      title="Mở thư mục Google Drive gốc"
                    >
                      Drive
                      <ArrowSquareOut size={11} />
                    </a>
                  )}
                  <a
                    href="#gallery"
                    className="group/btn flex items-center gap-1.5 rounded-full bg-accent py-1.5 pr-1.5 pl-3 text-[12px] font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
                  >
                    Xem ảnh
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 transition-transform duration-200 group-hover/btn:translate-x-0.5">
                      <ArrowRight size={10} weight="bold" />
                    </span>
                  </a>
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Modal chỉnh sửa album — chỉ admin */}
      {isAdmin && (
        <EditAlbumModal
          album={editingAlbum}
          onClose={() => setEditingAlbum(null)}
          onSaved={loadAlbums}
        />
      )}
    </section>
  );
}
