"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "@phosphor-icons/react";

/**
 * Băng CTA cuối trang — nền xanh Đoàn, chữ đồ sộ.
 */

export function CtaBand() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-cta-reveal]",
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power4.out",
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
            once: true,
          },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-[#0b4fb8] dark:bg-[#0a2e66]"
      aria-label="Khám phá kho tư liệu"
    >

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(48rem 26rem at 50% 0%, rgba(255,255,255,0.14), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-32 text-center md:py-44">
        <h2
          data-cta-reveal
          className="font-display max-w-4xl text-[clamp(2.2rem,5.5vw,4.2rem)] leading-[1.06] font-semibold tracking-[-0.02em] text-balance text-white"
        >
          Mỗi khoảnh khắc xứng đáng được lưu giữ
        </h2>

        <p
          data-cta-reveal
          className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-white/75 md:text-base"
        >
          Khám phá kho ảnh, video và những bộ sưu tập trọn vẹn của phong trào
          Đoàn trường THPT Vĩnh Thuận.
        </p>

        <div
          data-cta-reveal
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#gallery"
            className="group flex items-center gap-2.5 rounded-full bg-white py-3 pl-6 pr-2 text-sm font-semibold text-[#0b4fb8] transition-[transform,background-color] duration-300 hover:bg-white/90 active:scale-[0.98]"
          >
            Mở thư viện tư liệu
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0b4fb8]/15 transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRight size={13} weight="bold" />
            </span>
          </a>
          <a
            href="#albums"
            className="rounded-full border border-white/35 px-6 py-3 text-sm font-semibold text-white transition-[background-color,border-color,transform] duration-300 hover:border-white/70 hover:bg-white/10 active:scale-[0.98]"
          >
            Xem bộ sưu tập
          </a>
        </div>
      </div>
    </section>
  );
}
