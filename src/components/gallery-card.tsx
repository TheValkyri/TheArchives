"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { Play, Eye, DownloadSimple } from "@phosphor-icons/react";
import type { MediaItem } from "@/lib/data";

interface GalleryCardProps {
  item: MediaItem;
  index: number;
  onClick: () => void;
}

export function GalleryCard({ item, index, onClick }: GalleryCardProps) {
  const reduce = useReducedMotion();

  const aspectClass =
    item.aspect === "portrait"
      ? "row-span-2 aspect-[3/4]"
      : item.aspect === "square"
        ? "aspect-square"
        : "aspect-[4/3]";

  return (
    <motion.article
      onClick={onClick}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.6,
        delay: (index % 4) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`group relative overflow-hidden rounded-2xl bg-bg-card cursor-pointer border border-border-subtle hover:border-border-hover transition-all duration-300 p-1 ${aspectClass}`}
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
      <div className="relative w-full h-full rounded-[calc(1rem-2px)] overflow-hidden bg-bg-secondary">
        <Image
          src={item.src}
          alt={item.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-bg-primary/80 backdrop-blur-md text-text-primary border border-white/10">
            {item.category}
          </span>

          {item.type === "video" ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-red text-white text-[10px] font-semibold tracking-wider uppercase shadow-md">
              <Play size={10} weight="fill" />
              <span>Video</span>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-text-muted bg-bg-primary/80 backdrop-blur-md px-2 py-0.5 rounded">
              {item.schoolYear}
            </span>
          )}
        </div>

        {/* Center Hover Action Cue */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/90 text-white backdrop-blur-md text-xs font-medium shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Eye size={16} weight="bold" />
            <span>Xem chi tiết & Tải ảnh</span>
          </div>
        </div>

        {/* Bottom Details */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-sm font-medium text-text-primary leading-snug group-hover:text-white transition-colors duration-200 line-clamp-2">
            {item.title}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
            <span>{item.photographer}</span>
            <span className="font-mono text-text-secondary">{item.date}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
