"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Image from "next/image";
import {
  X,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  ShareNetwork,
  Camera,
  CalendarBlank,
  Tag,
  Play,
  Pause,
  ArrowSquareOut,
  Check,
} from "@phosphor-icons/react";
import type { MediaItem } from "@/lib/data";

interface MediaLightboxProps {
  item: MediaItem | null;
  items: MediaItem[];
  onClose: () => void;
  onNavigate: (item: MediaItem) => void;
}

export function MediaLightbox({
  item,
  items,
  onClose,
  onNavigate,
}: MediaLightboxProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();

  const currentIndex = item ? items.findIndex((i) => i.id === item.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      setIsPlaying(false);
      onNavigate(items[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, items, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      setIsPlaying(false);
      onNavigate(items[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, items, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!item) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose, handlePrev, handleNext]);

  useEffect(() => {
    if (item) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!item) return;
    const a = document.createElement("a");
    a.href = item.src;
    a.download = `${item.title.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] bg-bg-primary/95 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-4 md:px-8 border-b border-border-subtle bg-bg-primary/60">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
              {item.category}
            </span>
            <span className="text-xs text-text-muted hidden sm:inline">
              {item.album} · {item.schoolYear}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-muted mr-3">
              {currentIndex + 1} / {items.length}
            </span>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-all duration-200"
              aria-label="Đóng cửa sổ"
            >
              <X size={20} weight="light" />
            </button>
          </div>
        </div>

        {/* Central Media Stage */}
        <div className="relative flex-1 flex items-center justify-center p-4 md:p-8 min-h-[50vh]">
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-4 md:left-8 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/60 hover:bg-accent-blue/80 text-white backdrop-blur-md transition-all duration-300 active:scale-95 shadow-lg"
              aria-label="Ảnh trước"
            >
              <CaretLeft size={24} weight="bold" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-4 md:right-8 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/60 hover:bg-accent-blue/80 text-white backdrop-blur-md transition-all duration-300 active:scale-95 shadow-lg"
              aria-label="Ảnh tiếp theo"
            >
              <CaretRight size={24} weight="bold" />
            </button>
          )}

          <div className="relative w-full max-w-5xl h-[55vh] md:h-[65vh] rounded-2xl overflow-hidden bg-bg-secondary shadow-2xl border border-border-subtle flex items-center justify-center">
            <Image
              src={item.src}
              alt={item.title}
              fill
              className="object-contain"
              priority
              sizes="(max-width: 1280px) 90vw, 1200px"
            />

            {item.type === "video" && (
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-black/20 p-6">
                <div className="flex items-center justify-center mb-auto pt-24">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 rounded-full bg-accent-red hover:bg-accent-red-hover flex items-center justify-center text-white shadow-xl transition-transform duration-300 hover:scale-110 active:scale-95"
                    aria-label={isPlaying ? "Tạm dừng video" : "Phát video"}
                  >
                    {isPlaying ? (
                      <Pause size={28} weight="fill" />
                    ) : (
                      <Play size={28} weight="fill" className="ml-1" />
                    )}
                  </button>
                </div>

                <div className="w-full space-y-2">
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-accent-red transition-all duration-300 ${
                        isPlaying ? "w-2/3" : "w-1/4"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-white/70">
                    <span>{isPlaying ? "02:15" : "00:00"}</span>
                    <span>{item.videoDuration || "03:45"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Details Drawer */}
        <div className="border-t border-border-subtle bg-bg-secondary/90 px-4 py-5 md:px-8">
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold text-text-primary tracking-tight">
                {item.title}
              </h2>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Camera size={15} weight="light" className="text-accent-blue" />
                  {item.photographer}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarBlank size={15} weight="light" className="text-accent-gold" />
                  {item.date}
                </span>
                <span className="font-mono text-text-secondary bg-white/5 px-2 py-0.5 rounded">
                  {item.resolution}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] text-text-secondary bg-bg-card px-2.5 py-1 rounded-full border border-border-subtle"
                  >
                    <Tag size={12} weight="light" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-text-primary border border-border-subtle hover:border-border-hover transition-all duration-200"
              >
                {copied ? (
                  <>
                    <Check size={16} weight="bold" className="text-emerald-400" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <ShareNetwork size={16} weight="light" />
                    <span>Chia sẻ</span>
                  </>
                )}
              </button>

              {item.driveUrl && (
                <a
                  href={item.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-text-primary border border-border-subtle hover:border-border-hover transition-all duration-200"
                >
                  <ArrowSquareOut size={16} weight="light" />
                  <span>Google Drive gốc</span>
                </a>
              )}

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-accent-red hover:bg-accent-red-hover text-white transition-all duration-200 active:scale-95 shadow-md hover:shadow-accent-red/20"
              >
                <DownloadSimple size={16} weight="bold" />
                <span>Tải ảnh gốc</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
