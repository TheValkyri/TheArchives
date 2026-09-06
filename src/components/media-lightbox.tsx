"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  X,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  ShareNetwork,
  Camera,
  CalendarBlank,
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
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentIndex = item ? items.findIndex((i) => i.id === item.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate(items[currentIndex - 1]);
  }, [hasPrev, currentIndex, items, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate(items[currentIndex + 1]);
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
    document.documentElement.style.overflow = item ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [item]);

  // Swipe điều hướng trên mobile
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 60) {
      if (delta < 0) handlePrev();
      else handleNext();
    }
    touchStartX.current = null;
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = async () => {
    if (!item || isDownloading) return;
    setIsDownloading(true);

    const safeTitle =
      item.title.replace(/[/\\?%*:|"<>\u2013]/g, "-").trim() || "the-archives";
    const ext =
      item.src.split("?")[0].split(".").pop() ||
      (item.type === "video" ? "mp4" : "jpg");
    const filename = `${safeTitle}.${ext}`;

    try {
      const res = await fetch(item.src);
      if (!res.ok) throw new Error("Blob fetch failed");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      const downloadUrl = `${item.src}${item.src.includes("?") ? "&" : "?"}download=1&filename=${encodeURIComponent(filename)}`;
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 30000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100 flex flex-col bg-black/90 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-white/90 uppercase">
                {item.category}
              </span>
              <span className="hidden truncate text-[13px] text-white/50 sm:block">
                {item.album} · {item.schoolYear}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-mono text-[12px] text-white/50 tabular-nums">
                {currentIndex + 1} / {items.length}
              </span>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
                aria-label="Đóng cửa sổ"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Media stage */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center p-3 md:p-6"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {hasPrev && (
              <button
                onClick={handlePrev}
                className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-[background-color,transform] duration-200 hover:bg-white/25 active:scale-95 md:left-6"
                aria-label="Tư liệu trước"
              >
                <CaretLeft size={22} weight="bold" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={handleNext}
                className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-[background-color,transform] duration-200 hover:bg-white/25 active:scale-95 md:right-6"
                aria-label="Tư liệu tiếp theo"
              >
                <CaretRight size={22} weight="bold" />
              </button>
            )}

            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full w-full max-w-5xl overflow-hidden rounded-xl bg-black"
            >
              {item.type === "video" ? (
                <video
                  src={item.src}
                  controls
                  playsInline
                  autoPlay
                  className="h-full w-full object-contain"
                  aria-label={item.title}
                >
                  Trình duyệt của bạn không hỗ trợ phát video.
                </video>
              ) : (
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-contain"
                  priority
                  sizes="(max-width: 1280px) 95vw, 1024px"
                />
              )}
            </motion.div>
          </div>

          {/* Details drawer */}
          <div className="shrink-0 border-t border-white/10 bg-white/[0.03] px-4 py-4 md:px-6">
            <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 space-y-1.5">
                <h2 className="truncate text-lg font-semibold tracking-tight text-white">
                  {item.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-white/50">
                  <span className="flex items-center gap-1.5">
                    <Camera size={13} />
                    {item.photographer}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarBlank size={13} />
                    {item.date}
                  </span>
                  <span className="font-mono">{item.resolution}</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium text-white transition-[background-color,border-color] duration-200 hover:bg-white/10"
                >
                  {copied ? (
                    <>
                      <Check size={15} className="text-emerald-400" />
                      <span>Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <ShareNetwork size={15} />
                      <span>Chia sẻ</span>
                    </>
                  )}
                </button>

                {item.driveUrl && (
                  <a
                    href={item.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium text-white transition-[background-color,border-color] duration-200 hover:bg-white/10"
                  >
                    <ArrowSquareOut size={15} />
                    <span>Google Drive gốc</span>
                  </a>
                )}

                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-95 disabled:opacity-60"
                >
                  <DownloadSimple size={15} weight="bold" />
                  <span>{isDownloading ? "Đang tải..." : "Tải gốc"}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
