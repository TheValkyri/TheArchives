"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, Eye } from "@phosphor-icons/react";
import type { MediaItem } from "@/lib/data";
import { MediaLightbox } from "./media-lightbox";
import { SkyAmbient } from "./sky-ambient";

interface HeroProps {
  initialItems: MediaItem[];
}

export function Hero({ initialItems }: HeroProps) {
  const [latestMedia, setLatestMedia] = useState<MediaItem[]>(initialItems);
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const root = useRef<HTMLElement>(null);

  // GSAP reveal: dòng chữ, CTA và dải ảnh
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-hero-reveal]",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power4.out",
          delay: 0.15,
        }
      );

      gsap.fromTo(
        "[data-hero-film]",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          delay: 0.55,
          ease: "power4.out",
          scrollTrigger: {
            trigger: "[data-hero-film]",
            start: "top 95%",
            once: true,
          },
        }
      );

      // Dải ảnh trượt chậm khi cuộn trang
      gsap.to("[data-hero-film-track]", {
        x: -120,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="ambient-sky relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-32 pb-14"
    >
      {/* Bầu trời ambient — mây, bụi sáng, sao (dark), lông vũ, gió */}
      <SkyAmbient dense />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <p
          data-hero-reveal
          className="text-[12px] font-medium tracking-[0.28em] text-accent uppercase"
        >
          Đoàn Trường THPT Vĩnh Thuận
        </p>

        <h1
          data-hero-reveal
          className="font-display mt-5 max-w-5xl text-[clamp(2.1rem,6vw,4.6rem)] leading-[1.06] font-semibold tracking-[-0.02em] text-balance text-ink"
        >
          Ghi lại khoảnh khắc
          <br />
          <span className="text-accent">kể câu chuyện</span> thanh xuân
        </h1>

        <p
          data-hero-reveal
          className="mt-6 max-w-[54ch] text-[15px] leading-relaxed text-ink-2 md:text-base"
        >
          Kho ảnh và video chính thức của CLB Truyền Thông — lưu giữ phong trào
          Đoàn và những dấu ấn của trường THPT Vĩnh Thuận.
        </p>

        <div
          data-hero-reveal
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#gallery"
            className="group flex items-center gap-2.5 rounded-full bg-accent py-3 pl-6 pr-2 text-sm font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-accent-hover active:scale-[0.98]"
          >
            Khám phá thư viện
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 transition-transform duration-300 group-hover:translate-y-0.5">
              <ArrowDown size={13} weight="bold" />
            </span>
          </a>
          <a
            href="#albums"
            className="rounded-full border border-line-strong bg-bg/60 px-6 py-3 text-sm font-semibold text-ink backdrop-blur-sm transition-[background-color,border-color,transform] duration-300 hover:border-ink/30 hover:bg-surface active:scale-[0.98] dark:hover:border-line-strong dark:hover:bg-surface-2"
          >
            Album nổi bật
          </a>
        </div>
      </div>

      {/* Dải ảnh trượt ngang */}
      <div
        data-hero-film
        className="relative z-10 mt-16 w-full max-w-5xl md:mt-20"
      >
        <div
          data-hero-film-track
          className="no-scrollbar marquee-mask flex gap-4 overflow-x-auto pb-2"
        >
          {latestMedia.length > 0 ? (
            latestMedia.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveItem(img)}
                className="group relative h-32 w-48 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color,transform] duration-500 ease-out hover:scale-[1.04] hover:border-line-strong md:h-40 md:w-64"
                aria-label={`Xem ${img.title}`}
              >
                <Image
                  src={img.thumbUrl || img.src}
                  alt={img.title}
                  fill
                  unoptimized
                  loading="lazy"
                  decoding="async"
                  // Ảnh đầu trong viewport trên mobile — ưu tiên fetch
                  fetchPriority={i === 0 ? "high" : "auto"}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="256px"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-[opacity,background-color] duration-300 group-hover:bg-black/30 group-hover:opacity-100">
                  <Eye size={22} className="text-white" weight="bold" />
                </span>
              </button>
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="relative flex h-32 w-48 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface md:h-40 md:w-64"
                aria-hidden="true"
              >
                <div
                  className="h-14 w-14 rounded-full bg-surface-2"
                  style={{
                    animation: `dust-float ${7 + i}s ease-in-out infinite`,
                    animationDelay: `${-i * 1.3}s`,
                  }}
                />
              </div>
            ))
          )}
          <div className="relative flex h-32 w-48 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface md:h-40 md:w-64">
            <div className="flex flex-col items-center gap-2">
              <span className="relative block h-10 w-10 overflow-hidden rounded-full ring-1 ring-line-strong">
                <Image
                  src="/logo.jpg"
                  alt="Logo THPT Vĩnh Thuận"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </span>
              <span className="font-mono text-[10px] tracking-widest text-ink-3 uppercase">
                The Archives
              </span>
            </div>
          </div>
        </div>
      </div>

      <MediaLightbox
        item={activeItem}
        items={latestMedia}
        onClose={() => setActiveItem(null)}
        onNavigate={setActiveItem}
      />
    </section>
  );
}
