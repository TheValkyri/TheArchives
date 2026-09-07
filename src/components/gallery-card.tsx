"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Play } from "@phosphor-icons/react";
import type { MediaItem } from "@/lib/data";

interface GalleryCardProps {
  item: MediaItem;
  index: number;
  onClick: () => void;
}

export function GalleryCard({ item, index, onClick }: GalleryCardProps) {
  const root = useRef<HTMLElement>(null);

  // Vào view: phóng nhẹ 1 lần (once) — KHÔNG scrub khi cuộn (32+ card sẽ lag)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.current,
        { scale: 0.94, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.55,
          delay: (index % 6) * 0.04,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root.current,
            start: "top 94%",
            once: true,
          },
        }
      );
    }, root);

    return () => ctx.revert();
  }, [index]);

  const aspectClass =
    item.aspect === "portrait"
      ? "row-span-2 aspect-[3/4]"
      : item.aspect === "square"
        ? "aspect-square"
        : "aspect-[4/3]";

  // Card dùng thumbnail nhẹ; lightbox vẫn dùng file gốc
  const displaySrc = item.thumbUrl || item.src;

  return (
    <article
      ref={root}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface-2 transition-colors duration-300 hover:border-line-strong ${aspectClass}`}
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
      <Image
        src={displaySrc}
        alt={item.title}
        fill
        unoptimized
        loading="lazy"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {item.type === "video" && (
        <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
          <Play size={9} weight="fill" />
          Video
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 translate-y-1 p-3 transition-transform duration-300 group-hover:translate-y-0">
        <span className="block truncate text-[13px] font-medium text-white">
          {item.title}
        </span>
        <span className="mt-0.5 block text-[11px] text-white/70">
          {item.photographer} · {item.date}
        </span>
      </span>
    </article>
  );
}
