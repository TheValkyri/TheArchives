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

  // Vào view: phóng từ 0.92 lên 1. Ra khỏi view: mờ dần.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.current,
        { scale: 0.92, opacity: 0.35 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          delay: (index % 4) * 0.05,
          ease: "power4.out",
          scrollTrigger: {
            trigger: root.current,
            start: "top 92%",
            once: true,
          },
        }
      );

      gsap.to(root.current, {
        opacity: 0.25,
        scale: 0.96,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top -8%",
          end: "top -45%",
          scrub: 0.6,
        },
      });
    }, root);

    return () => ctx.revert();
  }, [index]);

  const aspectClass =
    item.aspect === "portrait"
      ? "row-span-2 aspect-[3/4]"
      : item.aspect === "square"
        ? "aspect-square"
        : "aspect-[4/3]";

  return (
    <article
      ref={root}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-300 hover:border-line-strong ${aspectClass}`}
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
        src={item.src}
        alt={item.title}
        fill
        unoptimized
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
