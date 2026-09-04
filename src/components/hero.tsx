"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { ArrowDown, Images, Sparkle, UploadSimple } from "@phosphor-icons/react";
import { getLiveMediaItems, type MediaItem } from "@/lib/data";

export function Hero() {
  const [latestMedia, setLatestMedia] = useState<MediaItem[]>([]);
  const reduce = useReducedMotion();

  const refreshLatest = () => {
    getLiveMediaItems().then((items) => {
      if (items) {
        setLatestMedia(items.slice(0, 4));
      }
    });
  };

  useEffect(() => {
    refreshLatest();

    const handleStorage = () => refreshLatest();
    const handleVisibility = () => {
      if (!document.hidden) refreshLatest();
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

  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center pt-24 pb-16 md:pb-24 overflow-hidden">
      {/* Ambient background glow matching Đoàn Youth Blue & Red */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent-blue/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[200px] bg-accent-red/8 blur-[100px] pointer-events-none rounded-full" />

      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 space-y-6">
            {/* Top Youth Union Badge */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/30 backdrop-blur-sm"
            >
              <Sparkle size={13} weight="fill" className="text-accent-gold" />
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-accent-blue font-medium">
                Đoàn Trường THPT Vĩnh Thuận
              </span>
            </motion.div>

            {/* Headline - Max 2 lines */}
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tighter leading-[1.08] text-text-primary"
            >
              Kho tư liệu <br />
              <span className="text-accent-red">The Archives</span>
            </motion.h1>

            {/* Subtext under 20 words */}
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-[48ch]"
            >
              Nơi lưu giữ từng khoảnh khắc thanh xuân, phong trào Đoàn và những dấu ấn tự hào của trường THPT Vĩnh Thuận.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <a
                href="#gallery"
                className="group flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-accent-red hover:bg-accent-red-hover text-white text-sm font-semibold transition-all duration-300 shadow-lg shadow-accent-red/25 active:scale-[0.98]"
              >
                <span>Khám phá thư viện</span>
                <span className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-y-0.5">
                  <ArrowDown size={14} weight="bold" />
                </span>
              </a>

              <a
                href="#albums"
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-text-primary border border-border-subtle hover:border-border-hover text-sm font-medium transition-all duration-300 active:scale-[0.98]"
              >
                <Images size={16} weight="light" className="text-accent-blue" />
                <span>Album nổi bật</span>
              </a>

              <a
                href="/admin"
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/30 text-xs font-semibold transition-all duration-300 active:scale-[0.98]"
              >
                <UploadSimple size={15} weight="bold" />
                <span>Cổng Quản Trị</span>
              </a>
            </motion.div>

            {/* Mobile Visual Strip if media exists */}
            {latestMedia.length > 0 && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="lg:hidden pt-4"
              >
                <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                  <span>Ảnh tư liệu mới nhất:</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory">
                  {latestMedia.map((img) => (
                    <div
                      key={img.id}
                      className="relative shrink-0 w-44 aspect-[4/3] rounded-xl overflow-hidden bg-bg-card border border-border-subtle snap-start"
                    >
                      <Image
                        src={img.src}
                        alt={img.title}
                        fill
                        className="object-cover"
                        sizes="176px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/90 font-medium px-2 py-0.5 rounded bg-black/40 backdrop-blur-xs">
                        {img.category}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Hero Visual Stage */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:grid col-span-6 grid-cols-2 gap-3.5"
          >
            {latestMedia.length > 0 ? (
              latestMedia.map((img, i) => (
                <div
                  key={img.id}
                  className={`relative overflow-hidden rounded-2xl bg-bg-card border border-border-subtle p-1 ${
                    i === 0 ? "row-span-2 aspect-[4/5]" : i === 1 ? "aspect-[4/3]" : i === 2 ? "aspect-square" : "aspect-[4/3.2]"
                  }`}
                >
                  <div className="relative w-full h-full rounded-xl overflow-hidden">
                    <Image
                      src={img.src}
                      alt={img.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105"
                      sizes="(max-width: 1024px) 0vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-3 left-3 text-[11px] font-mono text-white/90 bg-bg-primary/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 pointer-events-none">
                      {img.category}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              /* State khi chưa có ảnh nào trong DB: Card đại diện chính thức của CLB */
              <div className="col-span-2 rounded-3xl bg-bg-card/70 border border-border-subtle p-8 text-center space-y-5 backdrop-blur-xl shadow-2xl">
                <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden ring-4 ring-accent-blue/30 shadow-2xl">
                  <Image
                    src="/logo.jpg"
                    alt="Logo THPT Vĩnh Thuận"
                    fill
                    className="object-cover"
                    sizes="112px"
                    priority
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-gold font-semibold">
                    KHO LƯU TRỮ TRUYỀN THÔNG SỐ
                  </span>
                  <h3 className="text-xl font-semibold text-text-primary">
                    Trường THPT Vĩnh Thuận
                  </h3>
                  <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
                    Hệ thống lưu trữ đám mây S3 PIKAMC kết hợp Supabase PostgreSQL đã sẵn sàng. Ban Quản trị hãy đăng nhập để tải lên bộ ảnh đầu tiên.
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href="/admin"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-hover text-white text-xs font-semibold shadow-lg shadow-accent-blue/25 transition-all duration-200"
                  >
                    <UploadSimple size={15} weight="bold" />
                    <span>Đăng nhập Cổng Quản Trị để tải ảnh</span>
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
