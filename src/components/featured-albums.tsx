"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { Images, ArrowRight, ArrowSquareOut, FolderOpen, FolderPlus } from "@phosphor-icons/react";
import { albums, getLiveAlbums, type Album } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

export function FeaturedAlbums() {
  const [albumList, setAlbumList] = useState<Album[]>(albums);
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const refreshAlbums = () => {
    getLiveAlbums().then((live) => {
      if (live) {
        setAlbumList(live);
      }
    });
  };

  useEffect(() => {
    refreshAlbums();

    const handleStorage = () => refreshAlbums();
    const handleVisibility = () => {
      if (!document.hidden) refreshAlbums();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (reduce || !wrap.current || !track.current || albumList.length === 0) return;

    const ctx = gsap.context(() => {
      const getDistance = () => track.current!.scrollWidth - window.innerWidth;

      gsap.to(track.current, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${getDistance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);

    return () => ctx.revert();
  }, [reduce, albumList]);

  // Nếu chưa có album nào trong database
  if (albumList.length === 0) {
    return (
      <section id="albums" className="py-20 bg-bg-secondary/40 border-t border-b border-border-subtle">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-accent-blue/10 text-accent-blue mx-auto flex items-center justify-center">
            <FolderPlus size={24} weight="light" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary">
            Bộ sưu tập Album đang chờ cập nhật
          </h2>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Hệ thống đã dọn dẹp sạch dữ liệu mẫu. Ban Quản trị hãy vào Cổng Quản Trị để tạo các Album chuyên đề đầu tiên cho trường.
          </p>
          <div className="pt-2">
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue text-xs font-semibold transition-all duration-200"
            >
              <span>Vào Cổng Quản Trị tạo Album</span>
              <ArrowRight size={12} weight="bold" />
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="albums" ref={wrap} className="relative overflow-hidden bg-bg-secondary/60 border-t border-b border-border-subtle py-12 md:py-0">
      {reduce ? (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-border-subtle">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent-gold font-semibold">
                BỘ SƯU TẬP CHỦ ĐỀ
              </span>
              <h2 className="text-3xl md:text-5xl tracking-tighter font-semibold text-text-primary mt-2">
                Album nổi bật
              </h2>
            </div>
            <p className="text-text-secondary text-sm max-w-[45ch]">
              Các sự kiện lớn của Đoàn trường được tập hợp thành từng album chuyên đề để dễ dàng tra cứu.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albumList.map((album) => (
              <article
                key={album.id}
                className="group relative overflow-hidden rounded-2xl bg-bg-card border border-border-subtle hover:border-border-hover transition-all duration-300 p-1"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-bg-secondary">
                  <Image
                    src={album.cover}
                    alt={album.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/30 to-transparent" />
                  <span className="absolute top-3 left-3 text-[10px] font-mono text-white/90 bg-bg-primary/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    {album.schoolYear}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-blue transition-colors duration-200">
                    {album.title}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {album.description}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs text-text-secondary border-t border-border-subtle">
                    <span className="flex items-center gap-1">
                      <Images size={14} weight="light" className="text-accent-blue" />
                      <span>{album.count} tư liệu</span>
                    </span>
                    {album.driveFolderUrl && (
                      <a
                        href={album.driveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-accent-red hover:underline"
                      >
                        <span>Drive gốc</span>
                        <ArrowSquareOut size={12} weight="bold" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div
          ref={track}
          className="flex min-h-[100dvh] items-center gap-8 pl-6 md:pl-16 pr-16 w-max"
        >
          <div className="shrink-0 w-[300px] md:w-[380px] space-y-4 pr-4">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent-gold font-semibold">
              BỘ SƯU TẬP CHỦ ĐỀ
            </span>
            <h2 className="text-3xl md:text-5xl tracking-tighter font-semibold text-text-primary leading-tight">
              Album nổi bật <br />
              <span className="text-accent-blue font-normal">theo sự kiện</span>
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Các sự kiện lớn của Đoàn trường được biên tập và phân loại thành từng chuyên đề, đi kèm link Google Drive gốc cho nhu cầu in ấn và làm kỷ yếu.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-text-muted">
              <FolderOpen size={16} weight="light" className="text-accent-blue" />
              <span>Cuộn chuột để duyệt qua các album</span>
            </div>
          </div>

          {albumList.map((album) => (
            <article
              key={album.id}
              className="shrink-0 w-[340px] md:w-[420px] group rounded-2xl bg-bg-card border border-border-subtle hover:border-accent-blue/40 transition-all duration-300 p-1.5 shadow-xl"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-bg-secondary">
                <Image
                  src={album.cover}
                  alt={album.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                  sizes="420px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent" />

                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-mono text-white/90 bg-bg-primary/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    {album.schoolYear}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 space-y-1">
                  <h3 className="text-xl font-semibold text-white group-hover:text-accent-blue transition-colors duration-300">
                    {album.title}
                  </h3>
                  <p className="text-xs text-text-secondary line-clamp-2">
                    {album.description}
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between text-xs border-t border-border-subtle mt-1">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Images size={14} weight="light" className="text-accent-blue" />
                  <span className="font-mono">{album.count} tư liệu</span>
                </div>

                <div className="flex items-center gap-2">
                  {album.driveFolderUrl && (
                    <a
                      href={album.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-border-subtle transition-all duration-200"
                      title="Mở thư mục Google Drive gốc"
                    >
                      <span>Drive</span>
                      <ArrowSquareOut size={12} weight="light" />
                    </a>
                  )}

                  <a
                    href="#gallery"
                    className="group/btn flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-accent-blue hover:bg-accent-blue-hover text-white font-medium transition-all duration-200"
                  >
                    <span>Xem ảnh</span>
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-200 group-hover/btn:translate-x-0.5">
                      <ArrowRight size={10} weight="bold" />
                    </span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
